import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { LeagueName } from '@@/types/league';
import { LeagueOUProps, LeagueYNProps, LeagueSavedConfiguration } from '@@/types/statCaptureConfig';
import { SavedConfiguration } from '@@/types/statCaptureConfig';
import { MainMarketConfig, PropOUConfig, PropYNConfig } from '@@/types/statCaptureConfig';
import { TreePeriodNode, TreeExpansionState, TreeRootParams } from '@@/types/statCaptureConfig';


// ---------- Types ----------

export interface StatCaptureLeagueState {
    // Configurations
    leagueSavedConfigurations: LeagueSavedConfiguration[];
    currentlyLoadedConfiguration: SavedConfiguration | null;
    
    // Current draft
    currentDraft: SavedConfiguration;

    // Save config name(used in MLBSettingsView.tsx)
    saveConfigName: string;

    // Active tab
    activeTab: number;

    // NEW: Tree-based period state
    periodTree: TreePeriodNode[];
    periodTreeLoading: boolean;
    periodTreeError: string | null;
    expandedNodes: TreeExpansionState;

    // Over/Under props loading
    overUnderPropsLoading: boolean;
    overUnderPropsError: string | null;
    overUnderProps: LeagueOUProps[];

    // Yes/No props loading
    yesNoPropsLoading: boolean;
    yesNoPropsError: string | null;
    yesNoProps: LeagueYNProps[];

    // League configurations thunk
    leagueConfigurationsLoading: boolean;
    leagueConfigurationsError: string | null;

    // Stat capture configuration thunk
    statCaptureConfigurationLoading: boolean;
    statCaptureConfigurationError: string | null;

    // Save config thunk
    saveConfigLoading: boolean;
    saveConfigError: string | null;

    // Set active config thunk
    setActiveConfigLoading: boolean;
    setActiveConfigError: string | null;

    // Active config thunk
    activeConfigLoading: boolean;
    activeConfigError: string | null;
    activeConfig: SavedConfiguration | null;
}

export interface StatCaptureSettingsState {
    [leagueName: string]: StatCaptureLeagueState;
}

// ---------- Helper Functions ----------

/**
 * Recursively compares two objects for deep equality.
 * Arrays are compared order-insensitively (same elements, different order = equal).
 * 
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns True if objects have the same content, false otherwise
 */
function deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== typeof obj2) return false;
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    // Order-insensitive array comparison
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        if (obj1.length !== obj2.length) return false;
        
        const obj2Copy = [...obj2];
        for (const item1 of obj1) {
            const matchIndex = obj2Copy.findIndex(item2 => deepEqual(item1, item2));
            if (matchIndex === -1) return false;
            obj2Copy.splice(matchIndex, 1);
        }
        return true;
    }
    
    if (Array.isArray(obj1) || Array.isArray(obj2)) return false;
    
    // Object comparison
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
}

/**
 * Type-safe comparison helper specifically for SavedConfiguration objects
 * Excludes the isActive property from comparison as it's set by the system
 */
function compareConfigurations(config1: SavedConfiguration | null, config2: SavedConfiguration | null): boolean {
    if (!config1 || !config2) return config1 === config2;
    
    // Helper function to normalize MainMarketConfig objects(Remove 'name' property so that we can compare accurately)
    const normalizeMainMarkets = (markets: MainMarketConfig[]) => {
        return markets.map(market => ({
            marketType: market.marketType,
            periodTypeCode: market.periodTypeCode,
            periodNumber: market.periodNumber,
            strike: typeof market.strike === 'string' ? parseFloat(market.strike) : market.strike
        }));
    };
    
    // Helper function to normalize PropOUConfig objects  
    const normalizePropOU = (props: PropOUConfig[]) => {
        return props.map(prop => ({
            prop: prop.prop,
            contestantType: prop.contestantType,
            strike: typeof prop.strike === 'string' ? parseFloat(prop.strike) : prop.strike
        }));
    };
    
    // Create comparison objects excluding system-generated properties
    const compareObj1 = {
        name: config1.name,
        league: config1.league,
        mainMarkets: normalizeMainMarkets(config1.mainMarkets || []),
        propsOU: normalizePropOU(config1.propsOU || []),
        propsYN: config1.propsYN || []
    };
    
    const compareObj2 = {
        name: config2.name,
        league: config2.league,
        mainMarkets: normalizeMainMarkets(config2.mainMarkets || []),
        propsOU: normalizePropOU(config2.propsOU || []),
        propsYN: config2.propsYN || []
    };
    
    return deepEqual(compareObj1, compareObj2);
}

// ----- Deduplication helper functions -----

function deduplicateMainMarkets(markets: MainMarketConfig[]): MainMarketConfig[] {
    const seen = new Set<string>();
    return markets.filter(market => {
        const key = `${market.marketType}-${market.periodTypeCode}-${market.periodNumber}-${market.strike}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function deduplicateOUProps(props: PropOUConfig[]): PropOUConfig[] {
    const seen = new Set<string>();
    return props.filter(prop => {
        const key = `${prop.contestantType}-${prop.prop}-${prop.strike}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

function deduplicateYNProps(props: PropYNConfig[]): PropYNConfig[] {
    const seen = new Set<string>();
    return props.filter(prop => {
        const key = `${prop.contestantType}-${prop.prop}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// Generate unique key for tree nodes
function generateNodeKey(node: Partial<TreePeriodNode>): string {
    return `${node.Sport}-${node.League}-${node.SuperPeriodType}-${node.SuperPeriodNumber}-${node.SubPeriodType}-${node.SubPeriodNumber}`;
}

// Generate display name for tree nodes
function generateDisplayName(node: Partial<TreePeriodNode>): string {
    // Special case for root Match node (Full Game)
    if (node.SuperPeriodType === 'Match' && 
        node.SuperPeriodNumber === 1 && 
        node.SubPeriodType?.charAt(0) === '\0' && 
        node.SubPeriodNumber === 0) {
        return 'Full Game incl. Overtime (FG)';
    }
    
    if (node.TreeType === 'Branch') {
        if (node.SubPeriodType?.charAt(0) === '\0') {
            // Special display cases for Half periods
            if (node.SuperPeriodType === 'Half') {
                switch (node.SuperPeriodNumber) {
                    case 1:
                        return 'First 5 Innings (H1)';
                    case 13:
                        return 'First 3 Innings (H13)';
                    case 17:
                        return 'First 7 Innings (H17)';
                    default:
                        return `${node.SuperPeriodType} ${node.SuperPeriodNumber}`;
                }
            }
            return `${node.SuperPeriodType} ${node.SuperPeriodNumber}`;
        } else {
            return `${node.SubPeriodType} ${node.SubPeriodNumber}`;
        }
    } else {
        // For leaf nodes, use SubPeriodType and SubPeriodNumber
        return `${node.SubPeriodType} ${node.SubPeriodNumber}`;
    }
}

// Transform raw database result to TreePeriodNode
function transformToTreeNode(raw: any): TreePeriodNode {
    const node: TreePeriodNode = {
        Sport: raw.Sport.trim(),
        League: raw.League.trim(),
        SuperPeriodType: raw.SuperPeriodType.trim(),
        SuperPeriodNumber: raw.SuperPeriodNumber,
        SubPeriodType: raw.SubPeriodType.trim(),
        SubPeriodNumber: raw.SubPeriodNumber,
        
        // Parent relationship fields (from recursive CTE)
        Sport_Parent: raw.Sport_Parent?.trim(),
        League_Parent: raw.League_Parent?.trim(),
        SuperPeriodType_Parent: raw.SuperPeriodType_Parent?.trim(),
        SuperPeriodNumber_Parent: raw.SuperPeriodNumber_Parent,
        SubPeriodType_Parent: raw.SubPeriodType_Parent?.trim(),
        SubPeriodNumber_Parent: raw.SubPeriodNumber_Parent,
        
        // Hierarchy information
        HierarchyLevel: raw.HierarchyLevel || 0,
        
        // Fields from LeaguePeriodShortcode join
        PeriodTypeCode: raw.PeriodTypeCode?.trim(),
        PeriodNumber: raw.PeriodNumber,
        
        TreeType: raw.TreeType as 'Branch' | 'Node',
        DisplayName: '',
        NodeKey: '',
        isExpanded: false,
        children: []
    };
    
    node.NodeKey = generateNodeKey(node);
    node.DisplayName = generateDisplayName(node);
    
    return node;
}

// Build tree structure from flat hierarchy data
function buildTreeFromFlatData(flatNodes: TreePeriodNode[]): TreePeriodNode[] {
    // Create a map for quick lookup by node key
    const nodeMap = new Map<string, TreePeriodNode>();
    flatNodes.forEach(node => {
        nodeMap.set(node.NodeKey, { ...node, children: [] });
    });

    // Build the tree structure
    const rootNodes: TreePeriodNode[] = [];
    
    flatNodes.forEach(node => {
        const currentNode = nodeMap.get(node.NodeKey)!;
        
        // If this is a root node (HierarchyLevel 0), add it to root nodes
        if (node.HierarchyLevel === 0) {
            rootNodes.push(currentNode);
        } else {
            // Find the parent node
            const parentKey = generateNodeKey({
                Sport: node.Sport_Parent,
                League: node.League_Parent,
                SuperPeriodType: node.SuperPeriodType_Parent,
                SuperPeriodNumber: node.SuperPeriodNumber_Parent,
                SubPeriodType: node.SubPeriodType_Parent,
                SubPeriodNumber: node.SubPeriodNumber_Parent
            });
            
            const parentNode = nodeMap.get(parentKey);
            if (parentNode) {
                parentNode.children = parentNode.children || [];
                parentNode.children.push(currentNode);
            }
        }
    });

    // Sort children at each level (branches before leaves, then by name)
    const sortChildren = (nodes: TreePeriodNode[]) => {
        nodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                node.children.sort((a, b) => {
                    // Branches before leaves
                    if (a.TreeType !== b.TreeType) {
                        return a.TreeType === 'Branch' ? -1 : 1;
                    }
                    // Then by SuperPeriodType, SuperPeriodNumber, SubPeriodType, SubPeriodNumber
                    const typeCompare = a.SuperPeriodType.localeCompare(b.SuperPeriodType);
                    if (typeCompare !== 0) return typeCompare;
                    
                    const numberCompare = a.SuperPeriodNumber - b.SuperPeriodNumber;
                    if (numberCompare !== 0) return numberCompare;
                    
                    const subTypeCompare = a.SubPeriodType.localeCompare(b.SubPeriodType);
                    if (subTypeCompare !== 0) return subTypeCompare;
                    
                    return a.SubPeriodNumber - b.SubPeriodNumber;
                });
                sortChildren(node.children);
            }
        });
    };

    // Sort root nodes and their children
    rootNodes.sort((a, b) => {
        if (a.TreeType !== b.TreeType) {
            return a.TreeType === 'Branch' ? -1 : 1;
        }
        return a.SuperPeriodType.localeCompare(b.SuperPeriodType);
    });
    
    sortChildren(rootNodes);
    
    return rootNodes;
}

// ---------- Initial state ----------

const initialState: StatCaptureSettingsState = {};

// ---------- Async thunks ----------

// ---- League fetching -----

// NEW: Tree-based period fetching - single consolidated method
export const getLeaguePeriodTree = createAsyncThunk<
    TreePeriodNode[],
    { league: LeagueName },
    { rejectValue: string }
>(
    'statCaptureSettings/getLeaguePeriodTree',
    async ({ league }, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.getLeaguePeriodTree({ league });
            const transformedNodes = result.map(transformToTreeNode);
            return buildTreeFromFlatData(transformedNodes);
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching period tree.');
        }
    }
);

export const getLeagueProps = createAsyncThunk<
    LeagueOUProps[] | LeagueYNProps[],
    { leagueName: LeagueName, propType: 'OvrUnd' | 'YesNo' },
    { rejectValue: string }
    >(
    'statCaptureSettings/getLeagueProps',
    async ({ leagueName, propType }, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.getLeagueProps(leagueName, propType);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

// ---- Configuration fetching -----

export const getLeagueStatCaptureConfigurations = createAsyncThunk<
    LeagueSavedConfiguration[],
    LeagueName,
    { rejectValue: string }
>(
    'statCaptureSettings/getLeagueStatCaptureConfigurations',
    async (leagueName, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.fetchLeagueStatCaptureConfigurations(leagueName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const getStatCaptureConfiguration = createAsyncThunk<
    SavedConfiguration,
    { configName: string, leagueName: string },
    { rejectValue: string }
>(
    'statCaptureSettings/getStatCaptureConfiguration',
    async ({ configName, leagueName }, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.fetchStatCaptureConfiguration(configName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const saveStatCaptureConfiguration = createAsyncThunk<
    { success: boolean, configName: string },
    SavedConfiguration,
    { rejectValue: string }
>(
    'statCaptureSettings/saveStatCaptureConfiguration',
    async (config, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.saveStatCaptureConfiguration(config);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const setActiveStatCaptureConfiguration = createAsyncThunk<
    SavedConfiguration,
    { configName: string, leagueName: string },
    { rejectValue: string }
>(
    'statCaptureSettings/setActiveStatCaptureConfiguration',
    async ({ configName, leagueName }, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.setActiveStatCaptureConfiguration(configName, leagueName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching league periods.');
        }
    }
);

export const getActiveStatCaptureConfiguration = createAsyncThunk<
    SavedConfiguration,
    LeagueName,
    { rejectValue: string }
>(
    'statCaptureSettings/getActiveStatCaptureConfiguration',
    async (leagueName, { rejectWithValue }) => {
        try {
            const result = await window.electronAPI.getActiveStatCaptureConfiguration(leagueName);
            return result;
        } catch (err: any) {
            return rejectWithValue(err.message || 'An unexpected error occurred while fetching active configuration.');
        }
    }
);


// ---------- Slice ----------

const statCaptureSettingsSlice = createSlice({
    name: 'statCaptureSettings',
    initialState,
    reducers: {
        initializeLeague: (state, action: PayloadAction<LeagueName>) => {
            const leagueName: LeagueName = action.payload;
            if (!state[leagueName]) {
                state[leagueName] = {
                    activeTab: 0,
                    overUnderPropsLoading: false,
                    overUnderPropsError: null,
                    overUnderProps: [],
                    yesNoPropsLoading: false,
                    yesNoPropsError: null,
                    yesNoProps: [],
                    leagueSavedConfigurations: [],
                    currentlyLoadedConfiguration: null,
                    leagueConfigurationsLoading: false,
                    leagueConfigurationsError: null,
                    statCaptureConfigurationLoading: false,
                    statCaptureConfigurationError: null,
                    currentDraft: {
                        name: '',
                        league: leagueName,
                        isActive: false,
                        mainMarkets: [],
                        propsOU: [],
                        propsYN: []
                    },
                    saveConfigLoading: false,
                    saveConfigError: null,
                    setActiveConfigLoading: false,
                    setActiveConfigError: null,
                    activeConfigLoading: false,
                    activeConfigError: null,
                    activeConfig: null,
                    saveConfigName: '',
                    periodTree: [],
                    periodTreeLoading: false,
                    periodTreeError: null,
                    expandedNodes: {}
                };
            }
        },

        setActiveTab: (state, action: PayloadAction<{ leagueName: string; tabIndex: number }>) => {
            const { leagueName, tabIndex } = action.payload;
            if (state[leagueName]) {
                state[leagueName].activeTab = tabIndex;
            }
        },

        removeLeague: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload;
            delete state[leagueName];
        },

        updateCurrentDraft: (state, action: PayloadAction<{ leagueName: string; currentDraft: SavedConfiguration }>) => {
            const { leagueName, currentDraft } = action.payload;
            if (state[leagueName]) {
                state[leagueName].currentDraft = currentDraft;
            }
        },

        updateCurrentDraftMainMarkets: (state, action: PayloadAction<{ leagueName: string; mainMarkets: MainMarketConfig[] }>) => {
            const { leagueName, mainMarkets } = action.payload;
            if (state[leagueName]) {
                state[leagueName].currentDraft.mainMarkets = deduplicateMainMarkets(mainMarkets);
            }
        },

        updateCurrentDraftOUProps: (state, action: PayloadAction<{ leagueName: string; ouProps: PropOUConfig[] }>) => {
            const { leagueName, ouProps } = action.payload;
            if (state[leagueName]) {
                state[leagueName].currentDraft.propsOU = deduplicateOUProps(ouProps);
            }
        },

        updateCurrentDraftYNProps: (state, action: PayloadAction<{ leagueName: string; ynProps: PropYNConfig[] }>) => {
            const { leagueName, ynProps } = action.payload;
            if (state[leagueName]) {
                state[leagueName].currentDraft.propsYN = deduplicateYNProps(ynProps);
            }
        },

        // NEW: Tree state management actions
        toggleTreeNodeExpansion: (state, action: PayloadAction<{ leagueName: string; nodeKey: string }>) => {
            const { leagueName, nodeKey } = action.payload;
            if (state[leagueName]) {
                const currentExpanded = state[leagueName].expandedNodes[nodeKey] || false;
                state[leagueName].expandedNodes[nodeKey] = !currentExpanded;
            }
        },

        updateSaveConfigName: (state, action: PayloadAction<{ leagueName: string; saveConfigName: string }>) => {
            const { leagueName, saveConfigName } = action.payload;
            if (state[leagueName]) {
                state[leagueName].saveConfigName = saveConfigName;
            }
        },

        clearCurrentDraft: (state, action: PayloadAction<LeagueName>) => {
            const leagueName = action.payload;
            if (state[leagueName]) {
                state[leagueName].currentDraft = {
                    name: '',
                    league: leagueName,
                    isActive: false,
                    mainMarkets: [],
                    propsOU: [],
                    propsYN: []
                };
                state[leagueName].currentlyLoadedConfiguration = null;
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Get league props actions
            .addCase(getLeagueProps.pending, (state, action) => {
                const { leagueName, propType } = action.meta.arg;
                if (state[leagueName]) {
                    if (propType === 'OvrUnd') {
                        state[leagueName].overUnderPropsLoading = true;
                        state[leagueName].overUnderPropsError = null;
                    } else {
                        state[leagueName].yesNoPropsLoading = true;
                        state[leagueName].yesNoPropsError = null;
                    }
                }
            })
            .addCase(getLeagueProps.fulfilled, (state, action) => {
                const { leagueName, propType } = action.meta.arg;
                if (state[leagueName]) {
                    if (propType === 'OvrUnd') {
                        state[leagueName].overUnderPropsLoading = false;
                        state[leagueName].overUnderProps = action.payload as LeagueOUProps[];
                    } else {
                        state[leagueName].yesNoPropsLoading = false;
                        state[leagueName].yesNoProps = action.payload as LeagueYNProps[];
                    }
                }
            })
            .addCase(getLeagueProps.rejected, (state, action) => {
                const { leagueName, propType } = action.meta.arg;
                if (state[leagueName]) {
                    if (propType === 'OvrUnd') {
                        state[leagueName].overUnderPropsLoading = false;
                        state[leagueName].overUnderPropsError = action.payload ?? 'Failed to fetch league OU props';
                    } else {
                        state[leagueName].yesNoPropsLoading = false;
                        state[leagueName].yesNoPropsError = action.payload ?? 'Failed to fetch league YN props';
                    }
                }
            })

            // Get league stat capture configurations actions
            .addCase(getLeagueStatCaptureConfigurations.pending, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = true;
                    state[leagueName].leagueConfigurationsError = null;
                }
            })
            .addCase(getLeagueStatCaptureConfigurations.fulfilled, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = false;
                    state[leagueName].leagueSavedConfigurations = action.payload;
                }
            })
            .addCase(getLeagueStatCaptureConfigurations.rejected, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].leagueConfigurationsLoading = false;
                    state[leagueName].leagueConfigurationsError = action.payload ?? 'Failed to fetch league stat capture configurations';
                }
            })

            // Save stat capture configuration actions
            .addCase(saveStatCaptureConfiguration.pending, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = true;
                    state[config.league].saveConfigError = null;
                }
            })
            .addCase(saveStatCaptureConfiguration.fulfilled, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = false;

                    if (state[config.league].activeConfig?.name === config.name) {
                        state[config.league].activeConfig = config;
                    }
                    state[config.league].leagueSavedConfigurations.push({
                        league: config.league,
                        name: config.name
                    });
                    state[config.league].currentlyLoadedConfiguration = config;
                    state[config.league].currentDraft = config;
                }
            })
            .addCase(saveStatCaptureConfiguration.rejected, (state, action) => {
                const config = action.meta.arg;
                if (state[config.league]) {
                    state[config.league].saveConfigLoading = false;
                    state[config.league].saveConfigError = action.payload ?? 'Failed to save stat capture configuration';
                }
            })

            // Load individual stat capture configuration actions
            .addCase(getStatCaptureConfiguration.pending, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = true;
                    state[leagueName].statCaptureConfigurationError = null;
                }
            })
            .addCase(getStatCaptureConfiguration.fulfilled, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = false;
                    state[leagueName].currentDraft = action.payload;
                    state[leagueName].currentlyLoadedConfiguration = action.payload;
                }
            })
            .addCase(getStatCaptureConfiguration.rejected, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].statCaptureConfigurationLoading = false;
                    state[leagueName].statCaptureConfigurationError = action.payload ?? 'Failed to load stat capture configuration';
                }
            })

            // Set active stat capture configuration actions
            .addCase(setActiveStatCaptureConfiguration.pending, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].setActiveConfigLoading = true;
                    state[leagueName].setActiveConfigError = null;
                }
            })
            .addCase(setActiveStatCaptureConfiguration.fulfilled, (state, action) => {
                const { configName, leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].setActiveConfigLoading = false;
                    
                    if (state[leagueName].currentDraft.name === configName) {
                        state[leagueName].currentDraft.isActive = true;
                    } else {
                        state[leagueName].currentDraft.isActive = false;
                    }

                    state[leagueName].activeConfig = action.payload;
                }
            })
            .addCase(setActiveStatCaptureConfiguration.rejected, (state, action) => {
                const { leagueName } = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].setActiveConfigLoading = false;
                    state[leagueName].setActiveConfigError = action.payload ?? 'Failed to set active stat capture configuration';
                }
            })

            // Get active stat capture configuration
            .addCase(getActiveStatCaptureConfiguration.pending, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].activeConfigLoading = true;
                    state[leagueName].activeConfigError = null;
                }
            })
            .addCase(getActiveStatCaptureConfiguration.fulfilled, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].activeConfigLoading = false;
                    state[leagueName].activeConfig = action.payload;
                }
            })
            .addCase(getActiveStatCaptureConfiguration.rejected, (state, action) => {
                const leagueName = action.meta.arg;
                if (state[leagueName]) {
                    state[leagueName].activeConfigLoading = false;
                    state[leagueName].activeConfigError = action.payload ?? 'Failed to fetch active stat capture configuration';
                }
            })

            // NEW: Tree operations
            .addCase(getLeaguePeriodTree.pending, (state, action) => {
                const { league } = action.meta.arg;
                if (state[league]) {
                    state[league].periodTreeLoading = true;
                    state[league].periodTreeError = null;
                }
            })
            .addCase(getLeaguePeriodTree.fulfilled, (state, action) => {
                const { league } = action.meta.arg;
                if (state[league]) {
                    state[league].periodTreeLoading = false;
                    state[league].periodTree = action.payload;
                    // Keep expansion state - users may want their tree state preserved
                }
            })
            .addCase(getLeaguePeriodTree.rejected, (state, action) => {
                const { league } = action.meta.arg;
                if (state[league]) {
                    state[league].periodTreeLoading = false;
                    state[league].periodTreeError = action.payload ?? 'Failed to fetch period tree';
                }
            })
    }
});

// ---------- Actions ----------

export const {
    initializeLeague,
    setActiveTab,
    removeLeague,
    updateCurrentDraftMainMarkets,
    updateCurrentDraftOUProps,
    updateCurrentDraftYNProps,
    updateCurrentDraft,
    updateSaveConfigName,
    clearCurrentDraft,
    toggleTreeNodeExpansion
} = statCaptureSettingsSlice.actions;

// ---------- Selectors ----------

export const selectStatCaptureLeagueState = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): StatCaptureLeagueState | undefined => 
    state.simDash?.settings?.[leagueName];
export const selectActiveTab = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): number => 
    state.simDash?.settings?.[leagueName]?.activeTab ?? 0;
export const selectAllLeagues = (state: { simDash: { settings: StatCaptureSettingsState } }): string[] => 
    Object.keys(state.simDash?.settings || {});

// Legacy period selectors removed - use tree-based selectors instead

// League OU props selectors
export const selectLeagueOUProps = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): LeagueOUProps[] => 
    state.simDash?.settings?.[leagueName]?.overUnderProps ?? [];
export const selectLeagueOUPropsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.overUnderPropsLoading ?? false;
export const selectLeagueOUPropsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.overUnderPropsError ?? null;

// League YN props selectors
export const selectLeagueYNProps = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): LeagueYNProps[] => 
    state.simDash?.settings?.[leagueName]?.yesNoProps ?? [];
export const selectLeagueYNPropsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.yesNoPropsLoading ?? false;
export const selectLeagueYNPropsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.yesNoPropsError ?? null;

// League stat capture configurations selectors
export const selectLeagueStatCaptureConfigurations = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): LeagueSavedConfiguration[] => 
    state.simDash?.settings?.[leagueName]?.leagueSavedConfigurations ?? [];
export const selectLeagueStatCaptureConfigurationsLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.leagueConfigurationsLoading ?? false;
export const selectLeagueStatCaptureConfigurationsError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.leagueConfigurationsError ?? null;

// Individual stat capture configuration selectors
export const selectCurrentDraft = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): SavedConfiguration | undefined => 
    state.simDash?.settings?.[leagueName]?.currentDraft;
export const selectStatCaptureConfigurationLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.statCaptureConfigurationLoading ?? false;
export const selectStatCaptureConfigurationError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.statCaptureConfigurationError ?? null;

// Save configuration selectors
export const selectSaveConfigLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.saveConfigLoading ?? false;
export const selectSaveConfigError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.saveConfigError ?? null;

// Set active configuration selectors
export const selectSetActiveConfigLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.setActiveConfigLoading ?? false;
export const selectSetActiveConfigError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.setActiveConfigError ?? null;

// Active configuration selectors
export const selectActiveConfig = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): SavedConfiguration | null => 
    state.simDash?.settings?.[leagueName]?.activeConfig ?? null;
export const selectActiveConfigLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.activeConfigLoading ?? false;
export const selectActiveConfigError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.activeConfigError ?? null;

// Save config name selector
export const selectSaveConfigName = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string => 
    state.simDash?.settings?.[leagueName]?.saveConfigName ?? '';

// Currently loaded configuration selector
export const selectCurrentlyLoadedConfiguration = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): SavedConfiguration | null => 
    state.simDash?.settings?.[leagueName]?.currentlyLoadedConfiguration ?? null;

// Has unsaved changes selector - compares current draft to loaded configuration
export const selectHasUnsavedChanges = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => {
    const currentDraft = state.simDash?.settings?.[leagueName]?.currentDraft;
    const loadedConfig = state.simDash?.settings?.[leagueName]?.currentlyLoadedConfiguration;
    
    if (!loadedConfig || !currentDraft) {
        return false;
    }
    
    return !compareConfigurations(currentDraft, loadedConfig);
};

// NEW: Tree-based period selectors
export const selectPeriodTree = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): TreePeriodNode[] => 
    state.simDash?.settings?.[leagueName]?.periodTree ?? [];
export const selectPeriodTreeLoading = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): boolean => 
    state.simDash?.settings?.[leagueName]?.periodTreeLoading ?? false;
export const selectPeriodTreeError = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): string | null => 
    state.simDash?.settings?.[leagueName]?.periodTreeError ?? null;
export const selectExpandedNodes = (state: { simDash: { settings: StatCaptureSettingsState } }, leagueName: string): TreeExpansionState => 
    state.simDash?.settings?.[leagueName]?.expandedNodes ?? {};

// ---------- Reducer ----------

export default statCaptureSettingsSlice.reducer;
