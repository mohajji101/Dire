import { AppShell } from "@/components/app-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { CustomerProfileForm } from "@/components/customer-profile-form";
import { getCustomerTypeLabel } from "@/lib/customer-types";
import {
  getCurrentAppUser,
  getCurrentCustomerProfileData,
} from "@/lib/supabase/dire-data";

export default async function ProfilePage() {
  const [user, profileData] = await Promise.all([
    getCurrentAppUser(),
    getCurrentCustomerProfileData(),
  ]);
  const completenessChecks = profileData
    ? [
        { done: Boolean(profileData.customer.firstName.trim()), label: "First name" },
        { done: Boolean(profileData.customer.lastName.trim()), label: "Last name" },
        { done: Boolean(profileData.customer.phone.trim()), label: "Phone" },
        { done: Boolean(profileData.customer.country.trim()), label: "Country" },
        { done: Boolean(profileData.customer.city.trim()), label: "City" },
        { done: Boolean(profileData.customer.address.trim()), label: "Address" },
        {
          done:
            profileData.customer.customerType === "individual"
              ? true
              : Boolean(profileData.customer.companyName.trim()),
          label: "Company / organization",
        },
      ]
    : [];
  const profileCompletion = completenessChecks.length
    ? Math.round(
        (completenessChecks.filter((item) => item.done).length / completenessChecks.length) *
          100,
      )
    : 0;
  const missingFields = completenessChecks
    .filter((item) => !item.done)
    .map((item) => item.label);

  return (
    <AppShell activeItem="My Profile">
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 p-4 md:p-6">
        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-8">
          <p className="font-data text-sm font-semibold uppercase text-on-surface-variant">
            Profile
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold text-primary md:text-4xl">
            My Profile
          </h1>
          <p className="mt-3 max-w-3xl font-body text-base text-on-surface-variant md:text-lg">
            Review your customer account details and keep your contact information up to date.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="font-heading text-2xl font-bold text-primary">Account</h2>
            <div className="mt-5 space-y-4">
              <div>
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  Sign-in email
                </p>
                <p className="mt-1 font-data text-sm font-bold text-on-surface">{user.email}</p>
              </div>
              <div>
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  Role
                </p>
                <p className="mt-1 font-data text-sm font-bold capitalize text-on-surface">
                  {user.role.replaceAll("_", " ")}
                </p>
              </div>
              {profileData ? (
                <>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Suite number
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {profileData.customer.suiteNumber}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Customer code
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {profileData.customer.customerCode}
                    </p>
                  </div>
                  <div>
                    <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                      Customer type
                    </p>
                    <p className="mt-1 font-data text-sm font-bold text-on-surface">
                      {getCustomerTypeLabel(profileData.customer.customerType)}
                    </p>
                  </div>
                </>
              ) : null}
              <div>
                <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                  Profile completion
                </p>
                <p className="mt-1 font-data text-sm font-bold text-on-surface">
                  {profileCompletion}%
                </p>
                <div className="mt-3 h-2 rounded-full bg-surface-container-high">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {missingFields.length > 0 ? (
                  <p className="mt-2 font-body text-sm text-on-surface-variant">
                    Missing: {missingFields.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 font-body text-sm text-success">
                    Profile is complete.
                  </p>
                )}
              </div>
            </div>
          </aside>

          <div className="grid gap-5">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <h2 className="font-heading text-2xl font-bold text-primary">Contact Details</h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Update phone, address, city, and country here. Account type changes stay with admin.
              </p>

              {profileData ? (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {[
                      { label: "Phone", value: profileData.customer.phone || "Not set" },
                      { label: "City", value: profileData.customer.city || "Not set" },
                      { label: "Country", value: profileData.customer.country || "Not set" },
                    ].map((item) => (
                      <div
                        className="rounded-lg border border-outline-variant bg-surface-container-low p-4"
                        key={item.label}
                      >
                        <p className="font-data text-xs font-semibold uppercase text-on-surface-variant">
                          {item.label}
                        </p>
                        <p className="mt-2 font-data text-sm font-bold text-on-surface">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <CustomerProfileForm
                      customer={{
                        address: profileData.customer.address,
                        city: profileData.customer.city,
                        companyName: profileData.customer.companyName,
                        country: profileData.customer.country,
                        customerType: profileData.customer.customerType,
                        firstName: profileData.customer.firstName,
                        id: profileData.customer.id,
                        lastName: profileData.customer.lastName,
                        phone: profileData.customer.phone,
                      }}
                    />
                  </div>
                </>
              ) : (
                <p className="mt-6 font-body text-sm text-on-surface-variant">
                  No linked customer profile was found for this account yet.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm md:p-6">
              <h2 className="font-heading text-2xl font-bold text-primary">Security</h2>
              <p className="mt-1 font-body text-sm text-on-surface-variant">
                Set a new password for this portal account.
              </p>
              <div className="mt-6">
                <ChangePasswordForm />
              </div>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
