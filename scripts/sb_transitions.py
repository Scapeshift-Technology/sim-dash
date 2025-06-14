#%%

import pandas as pd
import os
import pybaseball as pb


#%% Get data

file_path = os.path.dirname(__file__)
# statcast_data = pd.read_csv(os.path.join(file_path, 'park-effects-api/endpoints/park_effects/scripts/saved/statcast_data.csv'))
fg_data = pd.read_csv(os.path.join(file_path, '../fg_data.csv'))
plays2023=pd.read_csv(os.path.join(file_path, '../2023plays.csv')) # retrosheet data. Available by year at https://www.retrosheet.org/downloads/othercsvs.html
plays2024=pd.read_csv(os.path.join(file_path, '../2024plays.csv')) # I use 2023 and 2024 because of the rule changes immediately before the 2023 season
retrosheet_data=pd.concat([plays2023, plays2024])

# SB / (SB + CS)
# (SB + CS) / (1B + 2B + 3B + BB + HBP + RBOE)

#%%
########## Use statcast data to sb rates in different situations ##########
### Stolen base attempts ###

def create_base_out_state(row):
    """Create base state string with base positions (e.g., '12X' for runners on 1B and 2B)"""
    state = '1' if not pd.isna(row['br1_pre']) else 'X'
    state += '2' if not pd.isna(row['br2_pre']) else 'X'
    state += '3' if not pd.isna(row['br3_pre']) else 'X'
    return f"{state}-{int(row['outs_pre'])}"

retrosheet_data['base_out_state'] = retrosheet_data.apply(create_base_out_state, axis=1)

sb_counts = retrosheet_data.groupby(['base_out_state', 'sb2', 'sb3', 'sbh', 'cs2', 'cs3', 'csh'])\
    .size().reset_index(name='count')

def get_runners_attempting(row):
    """Return list of bases attempting steals"""
    runners = []
    if row['sb2'] == 1 or row['cs2'] == 1:
        runners.append('1B')
    if row['sb3'] == 1 or row['cs3'] == 1:
        runners.append('2B') 
    if row['sbh'] == 1 or row['csh'] == 1:
        runners.append('3B')
    return runners

sb_counts['runners'] = sb_counts.apply(get_runners_attempting, axis=1)
sb_counts['runners_str'] = sb_counts['runners'].apply(lambda x: ','.join(x) if x else 'none')

# Create attempt indicators
sb_counts['att2'] = (sb_counts['sb2'] == 1) | (sb_counts['cs2'] == 1)  # 1B attempting to steal 2B
sb_counts['att3'] = (sb_counts['sb3'] == 1) | (sb_counts['cs3'] == 1)  # 2B attempting to steal 3B  
sb_counts['atth'] = (sb_counts['sbh'] == 1) | (sb_counts['csh'] == 1)  # 3B attempting to steal home

# Now aggregate by base_out_state and runners to get totals for each combination
runner_totals = sb_counts.groupby(['base_out_state', 'runners_str']).agg({
    'count': 'sum'  # Total times this runner combination occurred
}).reset_index()

# Calculate total opportunities per base_out_state (for probability calculation)
state_totals = runner_totals.groupby('base_out_state')['count'].sum().to_dict()

# Calculate probabilities for each runner combination within base_out_state
runner_totals['probability'] = runner_totals.apply(
    lambda row: row['count'] / state_totals[row['base_out_state']], axis=1
)

# Calculate success rates for each runner combination
def calculate_success_rates_for_group(base_state, runners_str):
    """Calculate success rates for this specific base_state + runners combination"""
    success_rates = {}
    
    # Get all rows for this combination
    mask = (sb_counts['base_out_state'] == base_state) & (sb_counts['runners_str'] == runners_str)
    group_data = sb_counts[mask]
    
    # For 1B runner (steals to 2B)
    att2_data = group_data[group_data['att2'] == True]
    if len(att2_data) > 0:
        successful_2b = att2_data[att2_data['sb2'] == 1]['count'].sum()
        total_att2 = att2_data['count'].sum()
        success_rates['1B'] = successful_2b / total_att2 if total_att2 > 0 else 0
    
    # For 2B runner (steals to 3B)  
    att3_data = group_data[group_data['att3'] == True]
    if len(att3_data) > 0:
        successful_3b = att3_data[att3_data['sb3'] == 1]['count'].sum()
        total_att3 = att3_data['count'].sum()
        success_rates['2B'] = successful_3b / total_att3 if total_att3 > 0 else 0
    
    # For 3B runner (steals home)
    atth_data = group_data[group_data['atth'] == True]
    if len(atth_data) > 0:
        successful_h = atth_data[atth_data['sbh'] == 1]['count'].sum()
        total_atth = atth_data['count'].sum()
        success_rates['3B'] = successful_h / total_atth if total_atth > 0 else 0
    
    return success_rates

# Apply success rate calculation
runner_totals['success_rates'] = runner_totals.apply(
    lambda row: calculate_success_rates_for_group(row['base_out_state'], row['runners_str']), 
    axis=1
)

# Convert runners_str back to list
runner_totals['runners'] = runner_totals['runners_str'].apply(
    lambda x: x.split(',') if x != 'none' else []
)

# Build final nested structure
steal_lookup = {}
for state in runner_totals['base_out_state'].unique():
    state_data = runner_totals[runner_totals['base_out_state'] == state]
    
    steal_lookup[state] = {
        'outcomes': []
    }
    
    for _, row in state_data.iterrows():
        bounded_success_rates = {}
        for runner, rate in row['success_rates'].items():
            bounded_success_rates[runner] = max(min(rate, 0.9), 0.1)
        
        steal_lookup[state]['outcomes'].append({
            'runners': row['runners'],
            'probability': row['probability'],
            'success_rates': bounded_success_rates
        })

#%%
### Save stolen bases

import json

# Save to JSON file
current_dir = os.path.dirname(os.path.abspath(__file__))
with open( '../src/services/mlb/sim/data/stolen_base_transitions.json', 'w') as f:
    json.dump(steal_lookup, f, indent=2)


#%%
########## Link our stats to true rates ##########
# For now, just make league average multiplier
### True SB rate(by plate appearance)




