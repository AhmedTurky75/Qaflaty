import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';

interface TeamMember {
  merchantId: string;
  fullName: string;
  email: string;
  phone: string | null;
  username: string;
  isVerified: boolean;
  role: string;
  isActive: boolean;
  invitedBy: string | null;
  joinedAt: string;
  createdAt: string;
}

const ASSIGNABLE_ROLES = ['Admin', 'Manager', 'Staff'];

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<div class="min-h-full bg-gray-50">
  <!-- Page Header -->
  <div class="bg-white border-b border-gray-200 px-6 py-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Team Management</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage store staff, roles, and access</p>
      </div>
      @if (isOwner()) {
        <button (click)="openInvite()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Invite Member
        </button>
      }
    </div>
  </div>

  <div class="p-6">
    <!-- Error -->
    @if (error()) {
      <div class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {{ error() }}
      </div>
    }

    <!-- Loading -->
    @if (loading()) {
      <div class="flex justify-center items-center py-20">
        <svg class="animate-spin h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>
    } @else {
      <!-- Members Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        @if (members().length === 0) {
          <div class="text-center py-16">
            <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p class="mt-3 text-sm text-gray-500">No team members yet.</p>
            @if (isOwner()) {
              <button (click)="openInvite()"
                class="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium">Invite your first member</button>
            }
          </div>
        } @else {
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                @if (isOwner()) {
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                }
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              @for (member of members(); track member.merchantId) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <!-- Member Info -->
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {{ getInitials(member.fullName) }}
                      </div>
                      <div>
                        <div class="flex items-center gap-1.5">
                          <p class="text-sm font-medium text-gray-900">{{ member.fullName }}</p>
                          @if (member.isVerified) {
                            <svg class="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                          }
                        </div>
                        <p class="text-xs text-gray-500">{{ member.email }}</p>
                        <p class="text-xs text-gray-400">&#64;{{ member.username }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Role -->
                  <td class="px-6 py-4">
                    @if (isOwner() && member.role !== 'Owner') {
                      <select [value]="member.role"
                        (change)="updateRole(member, $any($event.target).value)"
                        class="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer">
                        @for (r of roles; track r) {
                          <option [value]="r" [selected]="member.role === r">{{ r }}</option>
                        }
                      </select>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {{ getRoleBadgeClass(member.role) }}">
                        {{ member.role }}
                      </span>
                    }
                  </td>

                  <!-- Status -->
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                      {{ member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500' }}">
                      <span class="h-1.5 w-1.5 rounded-full {{ member.isActive ? 'bg-green-500' : 'bg-gray-400' }}"></span>
                      {{ member.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>

                  <!-- Joined -->
                  <td class="px-6 py-4 text-sm text-gray-500">
                    {{ formatDate(member.joinedAt) }}
                  </td>

                  <!-- Actions -->
                  @if (isOwner()) {
                    <td class="px-6 py-4 text-right">
                      @if (member.role !== 'Owner') {
                        <div class="flex items-center justify-end gap-3">
                          <button (click)="openResetPassword(member)"
                            class="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors">
                            Reset Password
                          </button>
                          <button (click)="removeMember(member)"
                            class="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                            Remove
                          </button>
                        </div>
                      } @else {
                        <span class="text-xs text-gray-300">—</span>
                      }
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Role legend -->
      <div class="mt-4 flex flex-wrap gap-3">
        @for (info of roleLegend; track info.role) {
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium {{ info.cls }}">{{ info.role }}</span>
            <span>{{ info.desc }}</span>
          </div>
        }
      </div>
    }
  </div>
</div>

<!-- ── Invite Modal ── -->
@if (showInviteModal()) {
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="closeInvite()"></div>

    <!-- Dialog -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Invite Team Member</h2>
        <button (click)="closeInvite()" class="p-1 text-gray-400 hover:text-gray-600 rounded-md">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Form -->
      <form [formGroup]="inviteForm" (ngSubmit)="inviteMember()" class="px-6 py-5 space-y-4">
        <!-- Name row -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">First Name</label>
            <input type="text" formControlName="firstName" placeholder="Ahmed"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-red-400]="isInvalid('firstName')" />
            @if (isInvalid('firstName')) {
              <p class="mt-0.5 text-xs text-red-600">Required (min 2 chars)</p>
            }
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
            <input type="text" formControlName="lastName" placeholder="Al-Rashid"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-red-400]="isInvalid('lastName')" />
            @if (isInvalid('lastName')) {
              <p class="mt-0.5 text-xs text-red-600">Required (min 2 chars)</p>
            }
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input type="email" formControlName="email" placeholder="member@example.com"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            [class.border-red-400]="isInvalid('email')" />
          @if (isInvalid('email')) {
            <p class="mt-0.5 text-xs text-red-600">Valid email required</p>
          }
        </div>

        <!-- Username -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Username</label>
          <input type="text" formControlName="username" placeholder="ahmed_rashid"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            [class.border-red-400]="isInvalid('username')" />
          @if (isInvalid('username')) {
            <p class="mt-0.5 text-xs text-red-600">Required (min 3 chars)</p>
          }
        </div>

        <!-- Password -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Initial Password</label>
          <input type="password" formControlName="password" placeholder="Min 8 characters"
            class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            [class.border-red-400]="isInvalid('password')" />
          @if (isInvalid('password')) {
            <p class="mt-0.5 text-xs text-red-600">Required (min 8 chars)</p>
          }
        </div>

        <!-- Phone + Role row -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Phone <span class="text-gray-400">(optional)</span></label>
            <input type="tel" formControlName="phone" placeholder="+966 5x xxx xxxx"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Role</label>
            <select formControlName="role"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </div>
        </div>

        @if (inviteError()) {
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {{ inviteError() }}
          </div>
        }

        <div class="flex gap-3 pt-1">
          <button type="submit" [disabled]="inviteLoading()"
            class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {{ inviteLoading() ? 'Inviting...' : 'Send Invite' }}
          </button>
          <button type="button" (click)="closeInvite()"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- ── Reset Password Modal ── -->
@if (showResetModal()) {
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="closeReset()"></div>

    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 class="text-base font-semibold text-gray-900">Reset Password</h2>
        <button (click)="closeReset()" class="p-1 text-gray-400 hover:text-gray-600 rounded-md">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="px-6 py-5">
        @if (selectedMember()) {
          <p class="text-sm text-gray-600 mb-4">
            Set a new password for <span class="font-medium text-gray-900">{{ selectedMember()!.fullName }}</span>.
          </p>
        }

        <form [formGroup]="resetForm" (ngSubmit)="submitResetPassword()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">New Password</label>
            <input type="password" formControlName="newPassword" placeholder="Min 8 characters"
              class="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              [class.border-red-400]="resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched" />
            @if (resetForm.get('newPassword')?.invalid && resetForm.get('newPassword')?.touched) {
              <p class="mt-0.5 text-xs text-red-600">Required (min 8 chars)</p>
            }
          </div>

          @if (resetError()) {
            <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {{ resetError() }}
            </div>
          }

          <div class="flex gap-3">
            <button type="submit" [disabled]="resetLoading()"
              class="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">
              {{ resetLoading() ? 'Saving...' : 'Reset Password' }}
            </button>
            <button type="button" (click)="closeReset()"
              class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
}
  `
})
export class TeamComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storeContext = inject(StoreContextService);

  members = signal<TeamMember[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  showInviteModal = signal(false);
  showResetModal = signal(false);
  selectedMember = signal<TeamMember | null>(null);

  inviteLoading = signal(false);
  inviteError = signal<string | null>(null);
  resetLoading = signal(false);
  resetError = signal<string | null>(null);

  roles = ASSIGNABLE_ROLES;

  isOwner = computed(() => {
    const merchant = this.authService.currentMerchant();
    const currentStore = this.storeContext.currentStore();
    return !!merchant && !!currentStore && currentStore.merchantId === merchant.id;
  });

  roleLegend = [
    { role: 'Owner', cls: 'bg-purple-100 text-purple-800', desc: 'Full access, manages team' },
    { role: 'Admin', cls: 'bg-blue-100 text-blue-800', desc: 'Full store access' },
    { role: 'Manager', cls: 'bg-indigo-100 text-indigo-800', desc: 'Orders, products, customers' },
    { role: 'Staff', cls: 'bg-gray-100 text-gray-700', desc: 'Limited access' },
  ];

  inviteForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    phone: [''],
    role: ['Staff', Validators.required]
  });

  resetForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  private get storeId() { return this.storeContext.currentStoreId(); }
  private get apiBase() { return `${environment.apiUrl}/stores/${this.storeId}/team`; }

  ngOnInit(): void { this.loadMembers(); }

  loadMembers(): void {
    if (!this.storeId) { this.loading.set(false); return; }
    this.loading.set(true);
    this.error.set(null);
    this.http.get<TeamMember[]>(this.apiBase, { withCredentials: true }).subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false); },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load team members');
        this.loading.set(false);
      }
    });
  }

  openInvite(): void {
    this.inviteForm.reset({ role: 'Staff' });
    this.inviteError.set(null);
    this.showInviteModal.set(true);
  }

  closeInvite(): void { this.showInviteModal.set(false); }

  inviteMember(): void {
    if (this.inviteForm.invalid) { this.inviteForm.markAllAsTouched(); return; }
    this.inviteLoading.set(true);
    this.inviteError.set(null);

    const body = {
      firstName: this.inviteForm.value.firstName,
      lastName: this.inviteForm.value.lastName,
      email: this.inviteForm.value.email,
      username: this.inviteForm.value.username,
      password: this.inviteForm.value.password,
      phone: this.inviteForm.value.phone || null,
      role: this.inviteForm.value.role
    };

    this.http.post(this.apiBase + '/invite', body, { withCredentials: true }).subscribe({
      next: () => {
        this.showInviteModal.set(false);
        this.inviteForm.reset({ role: 'Staff' });
        this.inviteLoading.set(false);
        this.loadMembers();
      },
      error: (err) => {
        this.inviteError.set(err.error?.message || err.error?.title || 'Failed to invite member');
        this.inviteLoading.set(false);
      }
    });
  }

  updateRole(member: TeamMember, newRole: string): void {
    if (member.role === newRole) return;
    this.http.patch(`${this.apiBase}/${member.merchantId}/role`, { newRole }, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err) => console.error('Failed to update role', err)
    });
  }

  openResetPassword(member: TeamMember): void {
    this.selectedMember.set(member);
    this.resetForm.reset();
    this.resetError.set(null);
    this.showResetModal.set(true);
  }

  closeReset(): void {
    this.showResetModal.set(false);
    this.selectedMember.set(null);
  }

  submitResetPassword(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    const member = this.selectedMember();
    if (!member) return;
    this.resetLoading.set(true);
    this.resetError.set(null);
    this.http.post(`${this.apiBase}/${member.merchantId}/reset-password`, this.resetForm.value, { withCredentials: true }).subscribe({
      next: () => {
        this.showResetModal.set(false);
        this.selectedMember.set(null);
        this.resetLoading.set(false);
      },
      error: (err) => {
        this.resetError.set(err.error?.message || 'Failed to reset password');
        this.resetLoading.set(false);
      }
    });
  }

  removeMember(member: TeamMember): void {
    if (!confirm(`Remove ${member.fullName} from this store? This cannot be undone.`)) return;
    this.http.delete(`${this.apiBase}/${member.merchantId}`, { withCredentials: true }).subscribe({
      next: () => this.loadMembers(),
      error: (err) => console.error('Failed to remove member', err)
    });
  }

  isInvalid(field: string): boolean {
    const c = this.inviteForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Owner':   return 'bg-purple-100 text-purple-800';
      case 'Admin':   return 'bg-blue-100 text-blue-800';
      case 'Manager': return 'bg-indigo-100 text-indigo-800';
      case 'Staff':   return 'bg-gray-100 text-gray-700';
      default:        return 'bg-gray-100 text-gray-600';
    }
  }

  getInitials(fullName: string): string {
    return fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
