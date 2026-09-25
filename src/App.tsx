/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { GoogleDriveProvider } from './context/GoogleDriveContext';
import { ToastProvider } from './context/ToastContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <ExpenseProvider>
      <GoogleDriveProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </GoogleDriveProvider>
    </ExpenseProvider>
  );
}
