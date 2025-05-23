import { EventType, MlbGameApiPlayResultEvent } from "@/types/mlb";

const mlbEventToSimEventMapping: Record<MlbGameApiPlayResultEvent, EventType> = {
  'single': '1B',
  'double': '2B',
  'triple': '3B',
  'home_run': 'HR',
  'walk': 'BB',
  'hit_by_pitch': 'BB',
  'strikeout': 'K',
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

function mlbEventToSimEvent(event: MlbGameApiPlayResultEvent): EventType {
  return mlbEventToSimEventMapping[event];
}

export { mlbEventToSimEvent };
