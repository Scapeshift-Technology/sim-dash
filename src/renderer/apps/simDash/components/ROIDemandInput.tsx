import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { setROIDemandPercentage, selectROIDemandPercentage } from '@/simDash/store/slices/userPreferencesSlice';

// ---------- Component ----------

const ROIDemandInput: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentValue = useSelector(selectROIDemandPercentage);
  
  const [inputValue, setInputValue] = useState<string>(currentValue.toString());
  const [error, setError] = useState<string>('');

  // Update local state when Redux state changes
  useEffect(() => {
    setInputValue(currentValue.toString());
  }, [currentValue]);

  // Debounced update to Redux
  useEffect(() => {
    const timer = setTimeout(() => {
      const numValue = parseFloat(inputValue);
      
      // Validation
      if (inputValue === '') {
        setError('');
        return;
      }
      
      if (isNaN(numValue)) {
        setError('Must be a valid number');
        return;
      }
      
      if (numValue > 10) {
        setError('Must be 10% or less');
        return;
      }
      
      // Clear error and update Redux
      setError('');
      if (numValue !== currentValue) {
        console.log('ROI Input - Dispatching update:', { numValue, currentValue });
        dispatch(setROIDemandPercentage(numValue));
      } else {
        console.log('ROI Input - No update needed:', { numValue, currentValue });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [inputValue, currentValue, dispatch]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleBlur = () => {
    // On blur, immediately validate and update if valid
    const numValue = parseFloat(inputValue);
    
    if (inputValue === '' || isNaN(numValue)) {
      // Reset to current value if invalid
      setInputValue(currentValue.toString());
      setError('');
      return;
    }
    
    if (numValue > 10) {
      // Reset to current value if out of range
      setInputValue(currentValue.toString());
      setError('');
      return;
    }
    
    // Update Redux immediately
    setError('');
    if (numValue !== currentValue) {
      console.log('ROI Input - Blur dispatching update:', { numValue, currentValue });
      dispatch(setROIDemandPercentage(numValue));
    } else {
      console.log('ROI Input - Blur no update needed:', { numValue, currentValue });
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
        ROI Demand:
      </Typography>
      <TextField
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        error={!!error}
        helperText={error}
        size="small"
        sx={{ 
          width: '100px',
          '& .MuiInputBase-root': {
            height: '32px'
          }
        }}
        InputProps={{
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
          inputProps: {
            step: 0.1,
            max: 10,
            style: { textAlign: 'center' }
          }
        }}
        variant="outlined"
      />
    </Box>
  );
};

export default ROIDemandInput; 