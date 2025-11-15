import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock fetch for testing
global.fetch = jest.fn();

describe("Admin Users API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should require admin authentication", async () => {
    // Mock unauthorized response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });

    const response = await fetch("/api/admin/users");
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should return users with pagination", async () => {
    // Mock successful admin response
    const mockUsers = [
      {
        id: "user-1",
        email: "test@example.com",
        role: "user",
        created_at: "2024-01-01T00:00:00Z",
        subscriptions: [],
        usage_counters: { total_generations: 5 },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          users: mockUsers,
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        }),
    });

    const response = await fetch("/api/admin/users");
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.users).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });

  it("should handle subscription override", async () => {
    // Mock successful subscription update
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          subscription: {
            id: 1,
            user_id: "user-1",
            provider: "admin_override",
            status: "active",
            current_period_end: "2024-12-31T23:59:59Z",
          },
          message: "Subscription updated successfully",
        }),
    });

    const response = await fetch("/api/admin/users/user-1/subscription", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "active",
        current_period_end: "2024-12-31",
      }),
    });

    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.success).toBe(true);
    expect(data.subscription.status).toBe("active");
  });
});

