from pybaseball import statcast, cache as pybaseball_cache
import pandas as pd
import json
from datetime import datetime

##########
# Note: This currently includes stolen bases/pickoffs/caught stealing events. This will be removed when we personalize baserunning. 
##########

####################
####################
# Get statcast data
today = datetime.now().strftime('%Y-%m-%d')

pybaseball_cache.enable()
statcast_data = statcast(start_dt='2023-01-01', end_dt=today, parallel=True, verbose=True)
print('Statcast data loaded')

# Filter out spring training data
statcast_data = statcast_data[statcast_data['game_type'] != 'S']

####################
####################
# Filter for rows with events and prepare data
statcast_data = statcast_data[statcast_data['events'].notna()]

# Select columns that we need and clear the rest
relevant_columns = [
    # Game Context
    'game_pk', 'game_type', 'at_bat_number', 'pitch_number',
    # Game state
    'inning', 'inning_topbot', 'outs_when_up', 'on_1b', 'on_2b', 'on_3b',
    # Scoring
    'post_bat_score', 'bat_score',
    # Outcome
    'events'
]
statcast_data = statcast_data[relevant_columns]

####################
####################
# Sort by game and at-bat
statcast_data = statcast_data.sort_values(['game_pk', 'at_bat_number', 'pitch_number'])

# Create base states
def create_base_state(row):
    """Create base state string (e.g., 'XOO' for runner on first)"""
    state = 'O' if pd.isna(row['on_1b']) else 'X'
    state += 'O' if pd.isna(row['on_2b']) else 'X'
    state += 'O' if pd.isna(row['on_3b']) else 'X'
    return f"{state}-{int(row['outs_when_up'])}"

def calculate_next_base_state(row):
    """Calculate the next base state, handling inning transitions"""
    # Handle last row of dataset
    if pd.isna(row['next_game_pk']):
        return None
    
    # If we're still in the same inning and game
    if (pd.notna(row['game_pk']) and pd.notna(row['next_game_pk']) and row['game_pk'] == row['next_game_pk'] and 
        pd.notna(row['inning']) and pd.notna(row['next_inning']) and row['inning'] == row['next_inning'] and 
        pd.notna(row['inning_topbot']) and pd.notna(row['next_inning_topbot']) and row['inning_topbot'] == row['next_inning_topbot']):
        return row['raw_next_base_state']
    else:
        return f"OOO-0"

# Add base state columns
statcast_data['base_state'] = statcast_data.apply(create_base_state, axis=1)

# Add next state information
statcast_data['raw_next_base_state'] = statcast_data['base_state'].shift(-1)
statcast_data['next_game_pk'] = statcast_data['game_pk'].shift(-1)
statcast_data['next_inning'] = statcast_data['inning'].shift(-1)
statcast_data['next_inning_topbot'] = statcast_data['inning_topbot'].shift(-1)
statcast_data['next_outs'] = statcast_data['outs_when_up'].shift(-1)

# Add next runners information
statcast_data['next_on_1b'] = statcast_data['on_1b'].shift(-1)
statcast_data['next_on_2b'] = statcast_data['on_2b'].shift(-1)
statcast_data['next_on_3b'] = statcast_data['on_3b'].shift(-1)

# Calculate runs scored and outs made in each transition
statcast_data['runs_scored'] = statcast_data['post_bat_score'] - statcast_data['bat_score']

# Calculate outs made, handling inning transitions
def calculate_outs_made(row):
    """Calculate outs made, handling inning transitions"""
    # Handle last row of dataset
    if pd.isna(row['next_game_pk']):
        return None
    
    # If we're still in the same inning and game
    if (pd.notna(row['game_pk']) and pd.notna(row['next_game_pk']) and row['game_pk'] == row['next_game_pk'] and 
        pd.notna(row['inning']) and pd.notna(row['next_inning']) and row['inning'] == row['next_inning'] and 
        pd.notna(row['inning_topbot']) and pd.notna(row['next_inning_topbot']) and row['inning_topbot'] == row['next_inning_topbot']):
        return row['next_outs'] - row['outs_when_up']
    else:
        return 3 - row['outs_when_up']

statcast_data['outs_made'] = statcast_data.apply(calculate_outs_made, axis=1)
statcast_data['next_base_state'] = statcast_data.apply(calculate_next_base_state, axis=1)

# Remove rows where we couldn't calculate transitions (last row of each game)
statcast_data = statcast_data[pd.notna(statcast_data['outs_made'])]

# Verify outs calculation
assert (statcast_data['outs_made'] >= 0).all(), "Found negative outs made"
assert (statcast_data['outs_made'] <= 3).all(), "Found too many outs made"

# Verify runs scored calculation
assert (statcast_data['runs_scored'] >= 0).all(), "Found negative runs scored"
assert (statcast_data['runs_scored'] <= 4).all(), "Found too many runs scored"

####################
####################
### Transition validation
# Count number of runners on base
runners_on = (pd.notna(statcast_data['on_1b']).astype(int) + 
              pd.notna(statcast_data['on_2b']).astype(int) + 
              pd.notna(statcast_data['on_3b']).astype(int))

next_runners_on = (pd.notna(statcast_data['next_on_1b']).astype(int) + 
                  pd.notna(statcast_data['next_on_2b']).astype(int) + 
                  pd.notna(statcast_data['next_on_3b']).astype(int))

# Check if transition is to a new inning, and is valid
new_inning_transition = (
    (statcast_data['game_pk'] != statcast_data['next_game_pk']) |  # New game
    (statcast_data['inning'] != statcast_data['next_inning']) |    # New inning
    (statcast_data['inning_topbot'] != statcast_data['next_inning_topbot'])  # Switch between top/bottom
)
invalid_inning_transitions = (
    new_inning_transition & (
        (statcast_data['outs_when_up'] + statcast_data['outs_made'] != 3) |
        (statcast_data['next_base_state'] != 'OOO-0')
    )
)

# Calculate expected change in runners
expected_next_runners = runners_on + 1 - statcast_data['outs_made'] - statcast_data['runs_scored']

# Remove impossible transitions where:
# 1. More runners score/out than possible in current state
# 2. Next state has more runners than possible given the play outcome
# 3. Next state doesn't match expected runners given outs/runs
# 4. Unless it's a new inning transition
# 5. Inning transitions must follow baseball rules
impossible_transitions = (
    (~new_inning_transition & (
        (statcast_data['outs_made'] + statcast_data['runs_scored'] > runners_on + 1) |  # Too many outs/runs from current state
        (next_runners_on > runners_on + 1) |  # Too many runners in next state (allowing +1 for batter)
        (next_runners_on != expected_next_runners)  # Number of next runners doesn't match what we expect
    )) |
    invalid_inning_transitions  # Invalid inning transition logic
)
statcast_data = statcast_data[~impossible_transitions]

####################
####################
# Categorize events
event_mapping = {
    'single': '1B',
    'double': '2B',
    'triple': '3B',
    'home_run': 'HR',
    'walk': 'BB',
    'hit_by_pitch': 'BB',
    # 'catcher_interf': 'BB',
    'strikeout': 'K',
    # 'strikeout_double_play': 'K',
    'field_out': 'OUT',
    'force_out': 'OUT',
    'fielders_choice': 'OUT',
    'fielders_choice_out': 'OUT',
    'grounded_into_double_play': 'OUT',
    'sac_fly': 'OUT',
    'double_play': 'OUT',
    'triple_play': 'OUT',
    'sac_fly_double_play': 'OUT',
    'field_error': 'OUT'
}

statcast_data['actual_event'] = statcast_data['events'].map(event_mapping)

####################
####################
# Filter for valid transitions
valid_transitions = (
    statcast_data['actual_event'].notna() 
)

transition_data = statcast_data[valid_transitions].copy()

####################
####################
# Calculate transition probabilities with additional statistics
transitions = (transition_data.groupby(['actual_event', 'base_state', 'next_base_state', 'runs_scored', 'outs_made'])
              .size()
              .reset_index(name='Count'))

# Calculate probabilities within each event-basestate group
transitions['Prob'] = transitions.groupby(['actual_event', 'base_state'])['Count'].transform(lambda x: x / x.sum())

# Create nested dictionary structure
transition_dict = {}
for _, row in transitions.iterrows():
    event = row['actual_event']
    start_state = row['base_state']
    end_state = row['next_base_state']
    prob = row['Prob']
    runs = int(row['runs_scored'])  # Convert to int for cleaner JSON
    outs = int(row['outs_made'])    # Convert to int for cleaner JSON
    
    # Initialize nested dictionaries if they don't exist
    if event not in transition_dict:
        transition_dict[event] = {}
    if start_state not in transition_dict[event]:
        transition_dict[event][start_state] = []

    # Create transition outcome object
    transition_outcome = {
        "end_state": end_state,
        "probability": float(prob),
        "runs_scored": runs,
        "outs_made": outs
    }

    # Add to list of outcomes for this event and start state
    transition_dict[event][start_state].append(transition_outcome)

####################
####################
# Save the results
output_path = 'src/services/mlb/sim/data/baserunner_transitions.json'
with open(output_path, 'w') as f:
    json.dump(transition_dict, f, indent=2)

print(f'Transitions saved to {output_path}')
