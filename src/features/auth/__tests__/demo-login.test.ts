import { describe, it, expect } from "vitest";
import { DEMO_CREDENTIALS, destinationForRole } from "../components/demo-login-modal";
import { unifiedLoginSchema } from "@/lib/validations";

describe("Demo Login Credentials & Roles", () => {
  it("provides exact credentials requested for Admin and Cashier observability", () => {
    expect(DEMO_CREDENTIALS.admin.email).toBe("zayed@yzcalo.com");
    expect(DEMO_CREDENTIALS.admin.password).toBe("12345678");

    expect(DEMO_CREDENTIALS.cashier.publicId).toBe("CSH-10003");
    expect(DEMO_CREDENTIALS.cashier.password).toBe("12345678");
  });

  it("routes each role to its designated operational workspace", () => {
    expect(destinationForRole("ADMIN")).toBe("/admin/select-business");
    expect(destinationForRole("CASHIER")).toBe("/pos/terminal");
    expect(destinationForRole("SUPER_ADMIN")).toBe("/super-admin");
  });

  it("produces valid login payloads conforming to unifiedLoginSchema", () => {
    const adminPayload = {
      loginType: "ADMIN" as const,
      email: DEMO_CREDENTIALS.admin.email,
      password: DEMO_CREDENTIALS.admin.password,
    };
    const adminValidation = unifiedLoginSchema.safeParse(adminPayload);
    expect(adminValidation.success).toBe(true);

    const cashierPayload = {
      loginType: "BUSINESS_USER" as const,
      publicId: DEMO_CREDENTIALS.cashier.publicId,
      password: DEMO_CREDENTIALS.cashier.password,
    };
    const cashierValidation = unifiedLoginSchema.safeParse(cashierPayload);
    expect(cashierValidation.success).toBe(true);
  });
});

