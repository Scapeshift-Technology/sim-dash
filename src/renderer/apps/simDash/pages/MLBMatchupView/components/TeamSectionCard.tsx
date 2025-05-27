import {
    Box,
    Typography,
    Paper,
    Divider,
    TextField
} from '@mui/material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSwappingStrategy
} from '@dnd-kit/sortable';

// ---------- Strategies ----------

// Custom strategy that provides no visual feedback
const noOpSortingStrategy = () => {
    return null; // No transforms applied
};

// ---------- Main component ----------

interface TeamSectionCardProps {
    title: string;
    adjustmentValue: number;
    onAdjustmentChange: (value: number) => void;
    children: React.ReactNode;
    currentOperation: 'swap' | 'move' | 'reorder' | null;
    isDraggable?: boolean;
    sortableItems?: number[];
    onDragOver?: (event: DragOverEvent) => void;
    onDragEnd?: (event: DragEndEvent) => void;
}

const TeamSectionCard: React.FC<TeamSectionCardProps> = ({
    title,
    adjustmentValue,
    onAdjustmentChange,
    children,
    currentOperation,
    isDraggable = false,
    sortableItems = [],
    onDragOver,
    onDragEnd
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const getAdjustmentColor = (value: number) => {
        if (value > 10 || value < -10) return 'error.main';
        if (value > 0) return 'success.main';
        if (value < 0) return 'error.main';
        return 'text.primary';
    };

    const isAdjustmentValid = (value: number) => value >= -10 && value <= 10;

    const renderAdjustmentInput = (label: string, value: number, onChange: (value: number) => void) => (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ mr: 1, minWidth: '100px' }}>
                {label}:
            </Typography>
            <TextField
                type="number"
                size="small"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                error={!isAdjustmentValid(value)}
                slotProps={{
                  input: {
                    inputProps: { 
                      min: -10, 
                      max: 10,
                      step: .5
                    },
                    endAdornment: <Typography variant="body2" sx={{ ml: 0.5 }}>%</Typography>
                  }
                }}
                sx={{ 
                    flex: 1,
                    '& .MuiInputBase-root': {
                        height: '28px'
                    },
                    '& .MuiInputLabel-root': {
                        color: getAdjustmentColor(value)
                    },
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                            borderColor: getAdjustmentColor(value)
                        },
                        '&:hover fieldset': {
                            borderColor: getAdjustmentColor(value)
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: getAdjustmentColor(value)
                        }
                    }
                }}
            />
        </Box>
    );

    const getSortingStrategy = () => {
        if (currentOperation === 'swap') return rectSwappingStrategy;
        return noOpSortingStrategy; // Includes 'move', 'reorder', and null for now
    };

    const content = (isDraggable && sortableItems.length > 0) && onDragEnd ? (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <SortableContext
                items={sortableItems}
                strategy={getSortingStrategy()}
            >
                {children}
            </SortableContext>
        </DndContext>
    ) : children;

    return (
        <Paper 
            elevation={1} 
            sx={{ 
                p: 2,
                backgroundColor: 'background.default'
            }}
        >
            {renderAdjustmentInput(`${title} Adjustment %`, adjustmentValue, onAdjustmentChange)}
            <Divider sx={{ my: 2 }} />
            {content}
        </Paper>
    );
};

export default TeamSectionCard;
