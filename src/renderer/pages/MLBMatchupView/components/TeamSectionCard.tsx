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
    DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSwappingStrategy
} from '@dnd-kit/sortable';

// ---------- Main component ----------

interface TeamSectionCardProps {
    title: string;
    adjustmentValue: number;
    onAdjustmentChange: (value: number) => void;
    children: React.ReactNode;
    isDraggable?: boolean;
    sortableItems?: number[];
    onDragEnd?: (event: DragEndEvent) => void;
}

const TeamSectionCard: React.FC<TeamSectionCardProps> = ({
    title,
    adjustmentValue,
    onAdjustmentChange,
    children,
    isDraggable = false,
    sortableItems = [],
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

    const content = (isDraggable && sortableItems.length > 0) && onDragEnd ? (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
        >
            <SortableContext
                items={sortableItems}
                strategy={rectSwappingStrategy}
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
