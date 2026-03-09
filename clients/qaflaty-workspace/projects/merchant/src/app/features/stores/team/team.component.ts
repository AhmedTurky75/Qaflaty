import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

interface TeamMember {
  merchantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

const ROLES = ['Admin', 'Manager', 'Staff'];

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="max-w-4xl mx-auto p-6">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-gray-900">Team Management</h1>
    <button (click)="showInvite.set(true)"
      class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700">
      + Invite Member
    </button>
  </div>

  <!-- Invite Form -->
  @if (showInvite()) {
    <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <h3 class="font-semibold text-gray-900 mb-3">Invite Team Member</h3>
      <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="space-y-3">
        <div>
          <input type="text" formControlName="emailOrUsername" placeholder="Email or username"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500" />
        </div>
        <div>
          <select formControlName="role" class="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
          </select>
        </div>
        @if (inviteError()) { <p class="text-sm text-red-600">{{ inviteError() }}</p> }
        <div class="flex gap-2">
          <button type="submit" [disabled]="inviteLoading()"
            class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm disabled:opacity-50">
            {{ inviteLoading() ? 'Inviting...' : 'Send Invite' }}
          </button>
          <button type="button" (click)="showInvite.set(false)" class="px-4 py-2 border border-gray-300 rounded-md text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  }

  <!-- Members List -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    @if (loading()) {
      <div class="p-8 text-center text-gray-500">Loading...</div>
    } @else {
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          @for (member of members(); track member.merchantId) {
            <tr>
              <td class="px-6 py-4">
                <p class="font-medium text-gray-900">{{ member.firstName }} {{ member.lastName }}</p>
                <p class="text-sm text-gray-500">{{ member.email }}</p>
              </td>
              <td class="px-6 py-4">
                <select [value]="member.role" (change)="updateRole(member, $any($event.target).value)"
                  class="text-sm border border-gray-300 rounded px-2 py-1">
                  @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
                </select>
              </td>
              <td class="px-6 py-4">
                <span [class]="member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ member.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button (click)="removeMember(member)"
                  class="text-sm text-red-600 hover:text-red-800">Remove</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>
</div>
  `
})
export class TeamComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  members = signal<TeamMember[]>([]);
  loading = signal(true);
  showInvite = signal(false);
  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);
  roles = ROLES;

  inviteForm: FormGroup = this.fb.group({
    emailOrUsername: ['', Validators.required],
    role: ['Staff', Validators.required]
  });

  private get storeId() { return this.authService.storeId(); }
  private get apiBase() { return `${environment.apiUrl}/stores/${this.storeId}/team`; }

  ngOnInit(): void { this.loadMembers(); }

  loadMembers(): void {
    if (!this.storeId) { this.loading.set(false); return; }
    this.http.get<TeamMember[]>(this.apiBase, { withCredentials: true }).subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  inviteMember(): void {
    if (this.inviteForm.invalid) return;
    this.inviteLoading.set(true); this.inviteError.set(null);
    this.http.post(`${this.apiBase}/invite`, this.inviteForm.value, { withCredentials: true }).subscribe({
      next: () => { this.showInvite.set(false); this.inviteForm.reset({ role: 'Staff' }); this.loadMembers(); this.inviteLoading.set(false); },
      error: (err: any) => { this.inviteError.set(err.error?.message || 'Failed to invite'); this.inviteLoading.set(false); }
    });
  }

  updateRole(member: TeamMember, role: string): void {
    this.http.put(`${this.apiBase}/${member.merchantId}/role`, { role }, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err: any) => console.error('Failed to update role', err)
    });
  }

  removeMember(member: TeamMember): void {
    if (!confirm(`Remove ${member.firstName} from this store?`)) return;
    this.http.delete(`${this.apiBase}/${member.merchantId}`, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err: any) => console.error('Failed to remove member', err)
    });
  }
}
