/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { ChatProvider, useChatContext } from '../ChatContext';

// Helper: wraps the hook in the ChatProvider so it has access to context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatProvider>{children}</ChatProvider>
);

describe('ChatContext', () => {
  it('should start with chat closed', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });

    expect(result.current.isOpen).toBe(false);
  });

  it('should open the chat when openChat is called', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });

    act(() => {
      result.current.openChat();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('should close the chat when closeChat is called', () => {
    const { result } = renderHook(() => useChatContext(), { wrapper });

    // Open first, then close
    act(() => {
      result.current.openChat();
    });
    act(() => {
      result.current.closeChat();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('should throw an error when used outside ChatProvider', () => {
    // Suppress console.error for this test since React will log the error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useChatContext());
    }).toThrow('useChatContext must be inside ChatProvider');

    spy.mockRestore();
  });
});