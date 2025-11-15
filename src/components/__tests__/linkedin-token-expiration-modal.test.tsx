import { render, screen } from "@testing-library/react";
import { LinkedInTokenExpirationModal } from "../linkedin-token-expiration-modal";

// Mock the dialog component
jest.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="modal">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-content">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-description">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="modal-title">{children}</div>
  ),
}));

describe("LinkedInTokenExpirationModal", () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders when open", () => {
    render(
      <LinkedInTokenExpirationModal
        isOpen={true}
        onClose={mockOnClose}
        daysUntilExpiration={3}
      />
    );

    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(
      screen.getByText("LinkedIn Connection Expiring Soon")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your LinkedIn connection will expire in 3 days/)
    ).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <LinkedInTokenExpirationModal
        isOpen={false}
        onClose={mockOnClose}
        daysUntilExpiration={3}
      />
    );

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("shows reconnect button with correct text", () => {
    render(
      <LinkedInTokenExpirationModal
        isOpen={true}
        onClose={mockOnClose}
        daysUntilExpiration={3}
      />
    );

    expect(screen.getByText("Reconnect Account")).toBeInTheDocument();
  });

  it("handles singular day correctly", () => {
    render(
      <LinkedInTokenExpirationModal
        isOpen={true}
        onClose={mockOnClose}
        daysUntilExpiration={1}
      />
    );

    expect(
      screen.getByText(/Your LinkedIn connection will expire in 1 day/)
    ).toBeInTheDocument();
  });
});
