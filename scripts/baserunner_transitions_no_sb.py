#%%
import pandas as pd
import json
import os

##########
# Note: This version excludes stolen bases/pickoffs/caught stealing events from transitions
# Uses retrosheet data to get pure batting outcome transitions
##########
#%%
####################
####################
# Load retrosheet data
file_path = os.path.dirname(__file__)
plays2023 = pd.read_csv('../2023plays.csv')  # Adjust path as needed
plays2024 = pd.read_csv('../2024plays.csv')  # Adjust path as needed
retrosheet_data = pd.concat([plays2023, plays2024])

print('Retrosheet data loaded')

####################
####################
# Parse retrosheet events to get basic play types
def parse_retrosheet_event(event_str):
    """Parse retrosheet event string to get basic play type"""
    if pd.isna(event_str):
        return None
    
    # Get the basic play (before any modifiers)
    basic_play = event_str.split('/')[0].split('.')[0]
    
    # Map retrosheet codes to our event types
    if basic_play.startswith('S'):  # Single
        return '1B'
    elif basic_play.startswith('D'):  # Double
        return '2B'
    elif basic_play.startswith('T'):  # Triple
        return '3B'
    elif basic_play.startswith('HR'):  # Home run
        return 'HR'
    elif basic_play in ['W', 'IW']:  # Walk, intentional walk
        return 'BB'
    elif basic_play == 'HP':  # Hit by pitch
        return 'BB'
    elif basic_play == 'K':  # Strikeout
        return 'K'
    elif basic_play in ['E', 'FC']:  # Error, fielder's choice
        return 'OUT'
    elif any(char.isdigit() for char in basic_play):  # Fielded out (contains fielder numbers)
        return 'OUT'
    else:
        # Skip non-batting events (SB, CS, WP, PB, BK, etc.)
        return None

# Filter out stolen base and non-batting events
def is_batting_event(event_str):
    """Check if event is a batting event (excludes SB, CS, WP, etc.)"""
    if pd.isna(event_str):
        return False
    
    basic_play = event_str.split('/')[0].split('.')[0]
    
    # Skip stolen base and baserunning-only events
    skip_events = ['SB', 'CS', 'WP', 'PB', 'BK', 'OA', 'PO', 'POCS', 'WP+PB']
    
    return not any(basic_play.startswith(skip) for skip in skip_events)

retrosheet_data = retrosheet_data[retrosheet_data['event'].apply(is_batting_event)]
retrosheet_data['actual_event'] = retrosheet_data['event'].apply(parse_retrosheet_event)
retrosheet_data = retrosheet_data[retrosheet_data['actual_event'].notna()]

####################
####################
# Create base states with player tracking
def create_base_state(row):
    """Create base state string with base positions (e.g., '12X' for runners on 1B and 2B)"""
    # Build state using base positions: 1=1B, 2=2B, 3=3B, X=empty
    state = 'X' if pd.isna(row['br1_pre']) else '1'
    state += 'X' if pd.isna(row['br2_pre']) else '2'
    state += 'X' if pd.isna(row['br3_pre']) else '3'
    return f"{state}-{int(row['outs_pre'])}"

def create_next_base_state(row):
    """Create next base state string with base positions and batter tracking"""
    outs = int(row['outs_post'])
    
    # If 3+ outs, inning ends and resets to XXX-0
    if outs >= 3:
        return "XXX-0"
    
    # Get batter ID to identify new batter on base
    batter_id = str(row['batter']) if 'batter' in row and not pd.isna(row['batter']) else None
    
    # Build post state using base positions and batter marker
    state = ''
    
    # 1B position
    if pd.isna(row['br1_post']):
        state += 'X'
    elif batter_id and str(row['br1_post']) == batter_id:
        state += 'B'  # Batter reached this base
    elif not pd.isna(row['br1_pre']) and str(row['br1_post']) == str(row['br1_pre']):
        state += '1'  # Original 1B runner stayed
    elif not pd.isna(row['br2_pre']) and str(row['br1_post']) == str(row['br2_pre']):
        state += '2'  # Original 2B runner moved to 1B
    elif not pd.isna(row['br3_pre']) and str(row['br1_post']) == str(row['br3_pre']):
        state += '3'  # Original 3B runner moved to 1B
    else:
        state += '1'  # Default to base position
    
    # 2B position
    if pd.isna(row['br2_post']):
        state += 'X'
    elif batter_id and str(row['br2_post']) == batter_id:
        state += 'B'  # Batter reached this base
    elif not pd.isna(row['br1_pre']) and str(row['br2_post']) == str(row['br1_pre']):
        state += '1'  # Original 1B runner moved to 2B
    elif not pd.isna(row['br2_pre']) and str(row['br2_post']) == str(row['br2_pre']):
        state += '2'  # Original 2B runner stayed
    elif not pd.isna(row['br3_pre']) and str(row['br2_post']) == str(row['br3_pre']):
        state += '3'  # Original 3B runner moved to 2B
    else:
        state += '2'  # Default to base position
        
    # 3B position
    if pd.isna(row['br3_post']):
        state += 'X'
    elif batter_id and str(row['br3_post']) == batter_id:
        state += 'B'  # Batter reached this base
    elif not pd.isna(row['br1_pre']) and str(row['br3_post']) == str(row['br1_pre']):
        state += '1'  # Original 1B runner moved to 3B
    elif not pd.isna(row['br2_pre']) and str(row['br3_post']) == str(row['br2_pre']):
        state += '2'  # Original 2B runner moved to 3B
    elif not pd.isna(row['br3_pre']) and str(row['br3_post']) == str(row['br3_pre']):
        state += '3'  # Original 3B runner stayed
    else:
        state += '3'  # Default to base position
    
    return f"{state}-{outs}"

# Add base state columns
retrosheet_data['base_state'] = retrosheet_data.apply(create_base_state, axis=1)
retrosheet_data['next_base_state'] = retrosheet_data.apply(create_next_base_state, axis=1)

# Calculate outs made (difference between post and pre outs)
retrosheet_data['outs_made'] = retrosheet_data['outs_post'] - retrosheet_data['outs_pre']

####################
####################
retrosheet_data['inning_ends'] = retrosheet_data['outs_post'] >= 3

def calculate_expected_runners(row):
    if row['inning_ends']:
        return 0  # Inning ends, all runners cleared
    else:
        runners_on = sum([not pd.isna(row['br1_pre']), not pd.isna(row['br2_pre']), not pd.isna(row['br3_pre'])])
        return runners_on + 1 - row['outs_made'] - row['runs']

expected_next_runners = retrosheet_data.apply(calculate_expected_runners, axis=1)

####################
####################
# Validation (similar to original)
# Verify outs calculation
assert (retrosheet_data['outs_made'] >= 0).all(), "Found negative outs made"
assert (retrosheet_data['outs_made'] <= 3).all(), "Found too many outs made"

# Verify runs scored calculation
assert (retrosheet_data['runs'] >= 0).all(), "Found negative runs scored"
assert (retrosheet_data['runs'] <= 4).all(), "Found too many runs scored"

# Additional validation for base state transitions  
runners_on = (pd.notna(retrosheet_data['br1_pre']).astype(int) + 
              pd.notna(retrosheet_data['br2_pre']).astype(int) + 
              pd.notna(retrosheet_data['br3_pre']).astype(int))

next_runners_on = (pd.notna(retrosheet_data['br1_post']).astype(int) + 
                  pd.notna(retrosheet_data['br2_post']).astype(int) + 
                  pd.notna(retrosheet_data['br3_post']).astype(int))

# For inning-ending plays, set next_runners_on to 0 
next_runners_on = next_runners_on.where(~retrosheet_data['inning_ends'], 0)

# Remove impossible transitions
impossible_transitions = (
    (retrosheet_data['outs_made'] + retrosheet_data['runs'] > runners_on + 1) |  # Too many outs/runs
    (next_runners_on > runners_on + 1) |  # Too many runners in next state  
    (next_runners_on != expected_next_runners)  # Inconsistent runner count
)

print(f"Removing {impossible_transitions.sum()} impossible transitions out of {len(retrosheet_data)}")
retrosheet_data = retrosheet_data[~impossible_transitions]

####################
####################
# Calculate transition probabilities (same structure as original)
transitions = (retrosheet_data.groupby(['actual_event', 'base_state', 'next_base_state', 'runs', 'outs_made'])
              .size()
              .reset_index(name='Count'))

# Calculate probabilities within each event-basestate group
transitions['Prob'] = transitions.groupby(['actual_event', 'base_state'])['Count'].transform(lambda x: x / x.sum())

# Create nested dictionary structure (same as original)
transition_dict = {}
for _, row in transitions.iterrows():
    event = row['actual_event']
    start_state = row['base_state']
    end_state = row['next_base_state']
    prob = row['Prob']
    runs = int(row['runs'])  # Convert to int for cleaner JSON
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
current_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(current_dir, '../src/services/mlb/sim/data/baserunner_transitions_no_sb.json')
with open(output_path, 'w') as f:
    json.dump(transition_dict, f, indent=2)

print(f'Baserunning transitions (excluding stolen bases) saved to {output_path}')




# %%
