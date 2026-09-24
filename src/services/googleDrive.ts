export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  shared?: boolean;
}

const FOLDER_NAME = 'Aura Finance Ledger & Budgets';

/**
 * Searches for or creates a dedicated folder in the user's personal Google Drive
 */
export const findOrCreateAppFolder = async (
  token: string
): Promise<{ id: string; name: string; webViewLink?: string }> => {
  const query = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!searchRes.ok) {
    const err = await searchRes.text();
    throw new Error(`Failed to search Google Drive folders: ${err}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0];
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Personal finance and expense ledger backups for Aura Finance',
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Failed to create Google Drive folder: ${err}`);
  }

  return await createRes.json();
};

/**
 * Save / upload a full JSON backup to user's Google Drive folder using multipart upload
 */
export const uploadBackupToDrive = async (
  token: string,
  backupData: any,
  fileName?: string
): Promise<DriveFile> => {
  const folder = await findOrCreateAppFolder(token);
  const name = fileName || `aura_finance_backup_${new Date().toISOString().split('T')[0]}.json`;

  const metadata = {
    name,
    mimeType: 'application/json',
    parents: [folder.id],
    description: `Personal financial backup with ${backupData.expenses?.length || 0} expenses and ${backupData.incomes?.length || 0} incomes.`,
  };

  const fileContent = JSON.stringify(backupData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload backup to Google Drive: ${err}`);
  }

  return await res.json();
};

const MASTER_LEDGER_FILENAME = 'aura_finance_auto_sync_ledger.json';

/**
 * Searches for or creates the continuous master sync file in user's Drive folder
 */
export const findOrCreateMasterLedgerFile = async (
  token: string,
  initialData: any
): Promise<DriveFile> => {
  const folder = await findOrCreateAppFolder(token);
  const query = encodeURIComponent(
    `name = '${MASTER_LEDGER_FILENAME}' and '${folder.id}' in parents and trashed = false`
  );

  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,size,webViewLink)&spaces=drive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0];
    }
  }

  // Create master file if it doesn't exist yet
  return await uploadBackupToDrive(token, initialData, MASTER_LEDGER_FILENAME);
};

/**
 * Fast patch update of existing Drive file content (for seamless auto-sync)
 */
export const updateDriveFileContent = async (
  token: string,
  fileId: string,
  content: any
): Promise<DriveFile> => {
  const fileContent = JSON.stringify(content, null, 2);

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime,size,webViewLink`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to auto-update file in Google Drive: ${err}`);
  }

  return await res.json();
};

/**
 * Save / upload spreadsheet CSV to user's Google Drive folder
 */
export const uploadCsvToDrive = async (
  token: string,
  csvContent: string,
  fileName?: string
): Promise<DriveFile> => {
  const folder = await findOrCreateAppFolder(token);
  const name = fileName || `aura_finance_ledger_${new Date().toISOString().split('T')[0]}.csv`;

  const metadata = {
    name,
    mimeType: 'text/csv',
    parents: [folder.id],
    description: 'Aura Finance spreadsheet export',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/csv\r\n\r\n' +
    csvContent +
    closeDelimiter;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload CSV to Google Drive: ${err}`);
  }

  return await res.json();
};

/**
 * List all backup files saved in user's dedicated folder
 */
export const listDriveBackups = async (token: string): Promise<DriveFile[]> => {
  const folder = await findOrCreateAppFolder(token);
  const query = encodeURIComponent(`'${folder.id}' in parents and trashed = false`);

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,modifiedTime,size,webViewLink,shared)&pageSize=30`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list files from Google Drive: ${err}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Download file content from Google Drive by file ID
 */
export const downloadDriveFile = async (token: string, fileId: string): Promise<any> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to download file from Google Drive: ${err}`);
  }

  return await res.json();
};

/**
 * Share a Drive file or folder with another person using their Gmail address
 */
export const shareDriveItem = async (
  token: string,
  fileOrFolderId: string,
  emailAddress: string,
  role: 'reader' | 'writer' = 'reader'
): Promise<void> => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileOrFolderId}/permissions?sendNotificationEmail=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
        type: 'user',
        emailAddress,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to share Google Drive item with ${emailAddress}: ${err}`);
  }
};

/**
 * Delete a backup file from Google Drive (Mandatory user confirmation handled by caller)
 */
export const deleteDriveFile = async (token: string, fileId: string): Promise<void> => {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    const err = await res.text();
    throw new Error(`Failed to delete file from Google Drive: ${err}`);
  }
};
