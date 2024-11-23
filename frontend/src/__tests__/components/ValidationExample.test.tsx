import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidationExample } from '@/components/examples/ValidationExample';
import { render } from '../helpers/render';

describe('ValidationExample', () => {
  beforeEach(() => {
    render(<ValidationExample />);
  });

  it('renders all form fields', () => {
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', async () => {
    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/name must be at least 2 characters/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid email', async () => {
    const emailInput = screen.getByLabelText(/email/i);

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid age', async () => {
    const ageInput = screen.getByLabelText(/age/i);

    fireEvent.change(ageInput, { target: { value: '-1' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/age cannot be negative/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid name format', async () => {
    const nameInput = screen.getByLabelText(/name/i);

    fireEvent.change(nameInput, { target: { value: '123' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /name can only contain letters, spaces, hyphens, and apostrophes/i
        )
      ).toBeInTheDocument();
    });
  });

  it('shows validation error for bio exceeding max length', async () => {
    const bioInput = screen.getByLabelText(/bio/i);

    fireEvent.change(bioInput, { target: { value: 'a'.repeat(501) } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/bio must not exceed 500 characters/i)
      ).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const ageInput = screen.getByLabelText(/age/i);
    const bioInput = screen.getByLabelText(/bio/i);
    const roleSelect = screen.getByLabelText(/role/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(ageInput, { target: { value: '30' } });
    fireEvent.change(bioInput, { target: { value: 'Test bio' } });
    fireEvent.change(roleSelect, { target: { value: 'user' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent(/submitting/i);
    });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent(/submit/i);
    });
  });

  it('disables submit button while submitting', async () => {
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const ageInput = screen.getByLabelText(/age/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(ageInput, { target: { value: '30' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/submitting/i);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent(/submit/i);
    });
  });

  it('resets form after successful submission', async () => {
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const ageInput = screen.getByLabelText(/age/i);

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(ageInput, { target: { value: '30' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
      expect(emailInput).toHaveValue('');
      expect(ageInput).toHaveValue('0');
    });
  });
});
