import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';
import { AuthStore } from '../../core/state/auth.store';
import { AddUserDialogComponent } from './add-user-dialog/add-user-dialog.component';
import { EditUserDialogComponent } from './edit-user-dialog/edit-user-dialog.component';
import { DeleteUserDialogComponent } from './delete-user-dialog/delete-user-dialog.component';

@Component({
  selector: 'app-admin',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatChipsModule],
  template: `
    <div class="header">
      <h1>User Management</h1>
      <button mat-raised-button color="primary" (click)="openAdd()">Add User</button>
    </div>

    <table mat-table [dataSource]="users()" class="full-width">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let u">
          {{ u.full_name || '-' }}
          @if (u.id === authStore.user()?.id) {
            <mat-chip class="you-chip">You</mat-chip>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let u">{{ u.email }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Role</th>
        <td mat-cell *matCellDef="let u">
          <mat-chip [class.admin-chip]="u.is_superuser">
            {{ u.is_superuser ? 'Admin' : 'User' }}
          </mat-chip>
        </td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let u">
          <mat-chip [class.active-chip]="u.is_active" [class.inactive-chip]="!u.is_active">
            {{ u.is_active ? 'Active' : 'Inactive' }}
          </mat-chip>
        </td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let u">
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="openEdit(u)">
              <mat-icon>edit</mat-icon> Edit
            </button>
            @if (u.id !== authStore.user()?.id) {
              <button mat-menu-item (click)="openDelete(u)">
                <mat-icon>delete</mat-icon> Delete
              </button>
            }
          </mat-menu>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
    </table>

    <div class="pagination">
      <button mat-button [disabled]="page() <= 1" (click)="goToPage(page() - 1)">Previous</button>
      <span>Page {{ page() }} of {{ totalPages() }}</span>
      <button mat-button [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Next</button>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; }
    .full-width { width: 100%; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 16px; margin-top: 16px; }
    .you-chip { font-size: 11px; margin-left: 8px; }
    .admin-chip { background: #3182ce; color: white; }
    .active-chip { background: #38a169; color: white; }
    .inactive-chip { background: #e53e3e; color: white; }
  `]
})
export class AdminComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  authStore = inject(AuthStore);

  displayedColumns = ['name', 'email', 'role', 'status', 'actions'];
  users = signal<User[]>([]);
  page = signal(1);
  totalPages = signal(1);
  private pageSize = 5;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    const skip = (this.page() - 1) * this.pageSize;
    this.userService.getUsers(skip, this.pageSize).subscribe({
      next: res => {
        this.users.set(res.data);
        this.totalPages.set(Math.max(1, Math.ceil(res.count / this.pageSize)));
      }
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadUsers();
  }

  openAdd(): void {
    const ref = this.dialog.open(AddUserDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('User created', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(EditUserDialogComponent, { width: '500px', data: user });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('User updated', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  openDelete(user: User): void {
    const ref = this.dialog.open(DeleteUserDialogComponent, { width: '400px', data: user });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('User deleted', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }
}
