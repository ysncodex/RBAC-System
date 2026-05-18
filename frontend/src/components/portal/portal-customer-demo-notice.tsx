export function PortalCustomerDemoNotice() {
  return (
    <p className="mb-6 rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Demo data</span> — these rows are static
      examples for anyone with the customer role. They are not loaded from the server and do not
      differ between seeded accounts and customers created from the staff UI.
    </p>
  );
}
