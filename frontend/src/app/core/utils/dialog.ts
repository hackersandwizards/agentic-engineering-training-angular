import { ComponentType } from '@angular/cdk/overlay';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

export function openDialogAndReload<T>(
  dialog: MatDialog,
  snackBar: MatSnackBar,
  destroyRef: DestroyRef,
  component: ComponentType<T>,
  config: MatDialogConfig,
  successMessage: string,
  reloadFn: () => void
): void {
  dialog
    .open(component, config)
    .afterClosed()
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((result) => {
      if (result) {
        snackBar.open(successMessage, 'Close', { duration: 3000 });
        reloadFn();
      }
    });
}
