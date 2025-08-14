import OrgSwitcher from "./OrgSwitcher";

// Server wrapper not needed — the client component handles its own data fetches.
// Keeping this file so you can import <OrgSwitcherServer /> in layouts/pages.
export default function OrgSwitcherServer() {
  return <OrgSwitcher />;
}
