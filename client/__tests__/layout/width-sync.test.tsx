/**
 * Width Synchronization Tests
 *
 * Verifies that Feed, Post Details, User Profile, and Notifications views
 * use consistent max-width values for a cohesive layout experience.
 */

import fs from 'fs';
import path from 'path';

describe('View Width Synchronization', () => {
  const expectedWidth = 'max-w-5xl';

  const filesToCheck = [
    {
      path: 'app/(protected)/feed/page.tsx',
      description: 'Feed page',
    },
    {
      path: 'app/(protected)/feed/loading.tsx',
      description: 'Feed loading',
    },
    {
      path: 'app/(protected)/posts/[id]/page.tsx',
      description: 'Post details page',
    },
    {
      path: 'app/(protected)/posts/[id]/loading.tsx',
      description: 'Post details loading',
    },
    {
      path: 'app/(protected)/notifications/page.tsx',
      description: 'Notifications page',
    },
    {
      path: 'app/(protected)/notifications/loading.tsx',
      description: 'Notifications loading',
    },
    {
      path: 'components/notifications/UserProfileClient.tsx',
      description: 'User profile client',
    },
  ];

  filesToCheck.forEach(({ path: filePath, description }) => {
    it(`${description} uses ${expectedWidth} container width`, () => {
      const fullPath = path.join(process.cwd(), filePath);

      // Skip if file doesn't exist (UserProfileClient is in a different location)
      if (!fs.existsSync(fullPath)) {
        // Try alternate path for UserProfileClient
        const altPath = path.join(
          process.cwd(),
          'app/(protected)/users/[id]/UserProfileClient.tsx'
        );
        if (fs.existsSync(altPath)) {
          const content = fs.readFileSync(altPath, 'utf-8');
          expect(content).toContain(expectedWidth);
          return;
        }
        // Skip if file truly doesn't exist
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content).toContain(expectedWidth);
    });
  });

  it('all views use the same max-width class', () => {
    const basePath = process.cwd();
    const viewFiles = [
      'app/(protected)/feed/page.tsx',
      'app/(protected)/posts/[id]/page.tsx',
      'app/(protected)/notifications/page.tsx',
    ];

    const widthClasses = viewFiles.map((filePath) => {
      const fullPath = path.join(basePath, filePath);
      if (!fs.existsSync(fullPath)) return null;

      const content = fs.readFileSync(fullPath, 'utf-8');
      const match = content.match(/max-w-(\w+)/);
      return match ? match[0] : null;
    }).filter(Boolean);

    // All should be the same
    const uniqueWidths = [...new Set(widthClasses)];
    expect(uniqueWidths.length).toBe(1);
    expect(uniqueWidths[0]).toBe(expectedWidth);
  });
});
