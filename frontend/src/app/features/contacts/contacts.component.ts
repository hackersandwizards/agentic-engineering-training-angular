import { Component, inject, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Contact } from '../../core/models/contact.model';
import { ContactService } from '../../core/services/contact.service';
import { AddContactDialogComponent } from './add-contact-dialog/add-contact-dialog.component';
import { EditContactDialogComponent } from './edit-contact-dialog/edit-contact-dialog.component';
import { DeleteContactDialogComponent } from './delete-contact-dialog/delete-contact-dialog.component';

@Component({
  selector: 'app-contacts',
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="header">
      <h1>Contacts</h1>
      <button mat-raised-button color="primary" (click)="openAdd()">Add Contact</button>
    </div>

    <table mat-table [dataSource]="contacts()" class="full-width">
      <ng-container matColumnDef="organisation">
        <th mat-header-cell *matHeaderCellDef>Organisation</th>
        <td mat-cell *matCellDef="let c">{{ c.organisation }}</td>
      </ng-container>
      <ng-container matColumnDef="description">
        <th mat-header-cell *matHeaderCellDef>Description</th>
        <td mat-cell *matCellDef="let c">{{ c.description || '-' }}</td>
      </ng-container>
      <ng-container matColumnDef="owner">
        <th mat-header-cell *matHeaderCellDef>Owner</th>
        <td mat-cell *matCellDef="let c">{{ c.owner?.full_name || c.owner?.email || '-' }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let c">
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="openEdit(c)">
              <mat-icon>edit</mat-icon> Edit
            </button>
            <button mat-menu-item (click)="openDelete(c)">
              <mat-icon>delete</mat-icon> Delete
            </button>
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
  `]
})
export class ContactsComponent implements OnInit {
  private contactService = inject(ContactService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns = ['organisation', 'description', 'owner', 'actions'];
  contacts = signal<Contact[]>([]);
  page = signal(1);
  totalPages = signal(1);
  private pageSize = 5;

  ngOnInit(): void {
    this.loadContacts();
  }

  loadContacts(): void {
    const skip = (this.page() - 1) * this.pageSize;
    this.contactService.getContacts(skip, this.pageSize).subscribe({
      next: res => {
        this.contacts.set(res.data);
        this.totalPages.set(Math.max(1, Math.ceil(res.count / this.pageSize)));
      }
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.loadContacts();
  }

  openAdd(): void {
    const ref = this.dialog.open(AddContactDialogComponent, { width: '500px' });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Contact created', 'Close', { duration: 3000 });
        this.loadContacts();
      }
    });
  }

  openEdit(contact: Contact): void {
    const ref = this.dialog.open(EditContactDialogComponent, { width: '500px', data: contact });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Contact updated', 'Close', { duration: 3000 });
        this.loadContacts();
      }
    });
  }

  openDelete(contact: Contact): void {
    const ref = this.dialog.open(DeleteContactDialogComponent, { width: '400px', data: contact });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Contact deleted', 'Close', { duration: 3000 });
        this.loadContacts();
      }
    });
  }
}
