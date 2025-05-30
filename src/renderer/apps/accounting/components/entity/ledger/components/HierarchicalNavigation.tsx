import React from 'react';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BreadcrumbItem, LedgerType, LedgerSubtype } from '../types';

interface HierarchicalNavigationProps {
  breadcrumbs: BreadcrumbItem[];
}

export const HierarchicalNavigation: React.FC<HierarchicalNavigationProps> = ({ breadcrumbs }) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Breadcrumbs sx={{ mb: 3 }}>
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        if (isLast || breadcrumb.current) {
          return (
            <Typography key={breadcrumb.path} color="text.primary">
              {breadcrumb.label}
            </Typography>
          );
        }
        
        return (
          <Link
            key={breadcrumb.path}
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handleNavigate(breadcrumb.path);
            }}
            sx={{ cursor: 'pointer' }}
          >
            {breadcrumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

// Utility functions for building breadcrumbs
export function buildLedgerBreadcrumbs(
  type?: LedgerType | null,
  subtype?: LedgerSubtype | null,
  current?: 'main' | 'type' | 'list' | 'detail' | 'form'
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Always start with Ledgers
  breadcrumbs.push({
    label: 'Ledgers',
    path: '/ledgers',
    current: current === 'main',
  });
  
  // Add type level if present
  if (type) {
    breadcrumbs.push({
      label: `${type} Ledgers`,
      path: `/ledgers/${type.toLowerCase()}`,
      current: current === 'type',
    });
  }
  
  // Add subtype level if present
  if (type && subtype) {
    breadcrumbs.push({
      label: `${type} ${subtype}`,
      path: `/ledgers/${type.toLowerCase()}/${subtype.toLowerCase()}`,
      current: current === 'list',
    });
  }
  
  return breadcrumbs;
}

export default HierarchicalNavigation; 