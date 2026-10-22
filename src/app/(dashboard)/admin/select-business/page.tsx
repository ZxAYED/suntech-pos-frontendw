import { BusinessBranchHub } from "@/features/tenant/components/business-branch-hub";

export const metadata = {
  title: "Select Business & Branch | SunTech POS",
  description: "Enterprise multi-tenant hierarchy and operational branch routing hub",
};

export default function SelectBusinessPage() {
  return <BusinessBranchHub initialStep={1} />;
}
