import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    Typography, 
    Box, 
    Checkbox, 
    FormControlLabel, 
    Collapse,
    CircularProgress,
    Alert,
    Snackbar
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";

import { TreePeriodNode } from '@@/types/statCaptureConfig';
import { LeagueName } from '@@/types/league';

import { AppDispatch, RootState } from "@/store/store";
import { 
    getLeaguePeriodTree,
    toggleTreeNodeExpansion,
    selectPeriodTree,
    selectPeriodTreeLoading,
    selectPeriodTreeError,
    selectExpandedNodes
} from "@/apps/simDash/store/slices/statCaptureSettingsSlice";

// ---------- Types ----------

export interface PeriodTreeSelectorProps {
    leagueName: LeagueName;
    selectedPeriods: string[];
    onPeriodChange: (period: TreePeriodNode) => void;
    getPeriodId: (period: TreePeriodNode) => string;
}

// ---------- Individual Tree Node Component ----------

interface TreeNodeProps {
    node: TreePeriodNode;
    leagueName: LeagueName;
    selectedPeriods: string[];
    onPeriodChange: (period: TreePeriodNode) => void;
    getPeriodId: (period: TreePeriodNode) => string;
    expandedNodes: { [key: string]: boolean };
    depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
    node,
    leagueName,
    selectedPeriods,
    onPeriodChange,
    getPeriodId,
    expandedNodes,
    depth
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const isExpanded = expandedNodes[node.NodeKey] || false;
    const isLeafNode = node.TreeType === 'Node';
    const isBranchNode = node.TreeType === 'Branch';
    
    // Branch nodes can have checkboxes if they have PeriodTypeCode and PeriodNumber
    const branchHasCheckbox = isBranchNode && node.PeriodTypeCode && node.PeriodNumber !== undefined;
    const showCheckbox = isLeafNode || branchHasCheckbox;

    const handleToggleExpansion = useCallback(async () => {
        if (isLeafNode) return; // Leaf nodes don't expand

        dispatch(toggleTreeNodeExpansion({ leagueName, nodeKey: node.NodeKey }));
    }, [dispatch, isLeafNode, leagueName, node.NodeKey]);

    const handleCheckboxChange = useCallback(() => {
        if (showCheckbox) {
            onPeriodChange(node);
        }
    }, [showCheckbox, node, onPeriodChange]);


    const indentLevel = depth * 24; // 24px per level

    return (
        <Box sx={{ ml: `${indentLevel}px` }}>
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: isBranchNode ? 'pointer' : 'default',
                    py: 0.5,
                    '&:hover': isBranchNode ? { backgroundColor: 'action.hover' } : {},
                    borderRadius: 1,
                    minHeight: 32
                }}
                onClick={isBranchNode ? handleToggleExpansion : undefined}
            >
                {/* Expansion icon for branches */}
                {isBranchNode && (
                    <Box sx={{ width: 24, display: 'flex', justifyContent: 'center' }}>
                        {isExpanded ? (
                            <ExpandLessIcon fontSize="small" />
                        ) : (
                            <ExpandMoreIcon fontSize="small" />
                        )}
                    </Box>
                )}
                
                {/* Checkbox for nodes that can be selected */}
                {showCheckbox && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={selectedPeriods.includes(getPeriodId(node))}
                                onChange={handleCheckboxChange}
                                size="small"
                                onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking checkbox
                            />
                        }
                        label={node.DisplayName}
                        sx={{ ml: isLeafNode ? 3 : 1, mr: 0 }} // Different indents for leaf vs branch
                        onClick={(e) => e.stopPropagation()} // Prevent expansion when clicking label
                    />
                )}

                {/* Branch label (when no checkbox) */}
                {isBranchNode && !branchHasCheckbox && (
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            ml: 1, 
                            fontWeight: 'medium',
                            color: 'text.primary'
                        }}
                    >
                        {node.DisplayName}
                    </Typography>
                )}
            </Box>

            {/* Children */}
            {isBranchNode && (
                <Collapse in={isExpanded}>
                    <Box>
                        {node.children?.map(child => (
                            <TreeNode
                                key={child.NodeKey}
                                node={child}
                                leagueName={leagueName}
                                selectedPeriods={selectedPeriods}
                                onPeriodChange={onPeriodChange}
                                getPeriodId={getPeriodId}
                                expandedNodes={expandedNodes}
                                depth={depth + 1}
                            />
                        ))}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
};

// ---------- Main Tree Selector Component ----------

const PeriodTreeSelector: React.FC<PeriodTreeSelectorProps> = ({
    leagueName,
    selectedPeriods,
    onPeriodChange,
    getPeriodId
}) => {
    const dispatch = useDispatch<AppDispatch>();

    // Redux state
    const periodTree = useSelector((state: RootState) => selectPeriodTree(state, leagueName));
    const loading = useSelector((state: RootState) => selectPeriodTreeLoading(state, leagueName));
    const error = useSelector((state: RootState) => selectPeriodTreeError(state, leagueName));
    const expandedNodes = useSelector((state: RootState) => selectExpandedNodes(state, leagueName));

    // Error snackbar state
    const [showError, setShowError] = React.useState(false);

    // Load tree root on mount
    useEffect(() => {
        if (periodTree.length === 0 && !loading) {
            dispatch(getLeaguePeriodTree({ league: leagueName }));
        }
    }, [dispatch, leagueName, periodTree.length, loading]);

    // Show error snackbar when error occurs
    useEffect(() => {
        if (error) {
            setShowError(true);
        }
    }, [error]);

    const handleCloseError = () => {
        setShowError(false);
    };

    if (loading && periodTree.length === 0) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error && periodTree.length === 0) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                Failed to load periods: {error}
            </Alert>
        );
    }

    return (
        <>
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Periods
                </Typography>
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {periodTree.map(node => (
                        <TreeNode
                            key={node.NodeKey}
                            node={node}
                            leagueName={leagueName}
                            selectedPeriods={selectedPeriods}
                            onPeriodChange={onPeriodChange}
                            getPeriodId={getPeriodId}
                            expandedNodes={expandedNodes}
                            depth={0}
                        />
                    ))}
                </Box>
            </Box>

            {/* Error Snackbar */}
            <Snackbar
                open={showError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            >
                <Alert 
                    onClose={handleCloseError} 
                    severity="error" 
                    sx={{ width: '100%' }}
                >
                    {error || 'An error occurred while loading tree data'}
                </Alert>
            </Snackbar>
        </>
    );
};

export default PeriodTreeSelector; 