jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

// Mock lucide icons to avoid SVG/native rendering issues in Jest
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: any) => React.createElement(View, { testID: props.testID });
  return new Proxy({}, { get: () => Icon });
});

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import DateTimePicker from '@/components/DateTimePicker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Date at a known, stable absolute moment so assertions are not flaky */
function makeDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  const d = new Date(year, month - 1, day, hour, minute, 0, 0);
  return d;
}

// A reference date that is "today" relative to the test run.
// We use new Date() as the base and just note that tests dealing with
// "today/yesterday" labels depend on the system clock — that's intentional.

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe('DateTimePicker – rendering', () => {
  test('renders the label when provided', () => {
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} label="When did this happen?" />
    );
    expect(getByText('When did this happen?')).toBeTruthy();
  });

  test('does not render a label element when label prop is omitted', () => {
    const { queryByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    expect(queryByText('When did this happen?')).toBeNull();
  });

  test('renders the Edit hint on the trigger button', () => {
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    expect(getByText('Edit')).toBeTruthy();
  });

  test('shows "Today" prefix when value is today', () => {
    const today = new Date();
    const { getByText } = render(
      <DateTimePicker value={today} onChange={jest.fn()} />
    );
    const triggerText = getByText(/^Today,/);
    expect(triggerText).toBeTruthy();
  });

  test('shows "Yesterday" prefix when value is yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { getByText } = render(
      <DateTimePicker value={yesterday} onChange={jest.fn()} />
    );
    expect(getByText(/^Yesterday,/)).toBeTruthy();
  });

  test('shows a date string (not Today/Yesterday) for dates older than yesterday', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const { queryByText } = render(
      <DateTimePicker value={twoDaysAgo} onChange={jest.fn()} />
    );
    expect(queryByText(/^Today,/)).toBeNull();
    expect(queryByText(/^Yesterday,/)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------------

describe('DateTimePicker – modal open/close', () => {
  test('modal is not visible initially', () => {
    const { queryByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    expect(queryByText('When did this happen?')).toBeNull();
  });

  test('tapping the trigger button opens the modal', () => {
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    fireEvent.press(getByText('Edit'));
    expect(getByText('When did this happen?')).toBeTruthy();
  });

  test('modal shows day-option chips for all 7 days', () => {
    const { getByText, getByTestId } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    fireEvent.press(getByText('Edit'));
    expect(getByText('Today')).toBeTruthy();
    expect(getByText('Yesterday')).toBeTruthy();
    // offsets 2-6 are rendered as date chips
    for (let i = 2; i <= 6; i++) {
      expect(getByTestId(`day-chip-${i}`)).toBeTruthy();
    }
  });

  test('modal shows the Confirm button', () => {
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    fireEvent.press(getByText('Edit'));
    expect(getByText('Confirm')).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Confirm button – regression test for the event-propagation bug
// ---------------------------------------------------------------------------

describe('DateTimePicker – Confirm button (regression)', () => {
  test('pressing Confirm calls onChange', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Confirm'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('pressing Confirm calls onChange with a Date object', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Confirm'));
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  test('pressing Confirm with no changes passes back the same date (today, same time)', () => {
    const base = new Date();
    base.setSeconds(0, 0);
    const onChange = jest.fn();
    const { getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    // Should be today with the same hour and minute
    const now = new Date();
    expect(returned.getDate()).toBe(now.getDate());
    expect(returned.getHours()).toBe(base.getHours());
    expect(returned.getMinutes()).toBe(base.getMinutes());
  });

  test('pressing Confirm closes the modal', () => {
    const { getByText, queryByText } = render(
      <DateTimePicker value={new Date()} onChange={jest.fn()} />
    );
    fireEvent.press(getByText('Edit'));
    expect(getByText('Confirm')).toBeTruthy();
    fireEvent.press(getByText('Confirm'));
    expect(queryByText('Confirm')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Day chip selection
// ---------------------------------------------------------------------------

describe('DateTimePicker – day chips', () => {
  test('selecting Yesterday and confirming returns a date from yesterday', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <DateTimePicker value={new Date()} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Yesterday'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(returned.getDate()).toBe(yesterday.getDate());
    expect(returned.getMonth()).toBe(yesterday.getMonth());
    expect(returned.getFullYear()).toBe(yesterday.getFullYear());
  });

  test('selecting a date chip 2 days back and confirming returns a date from two days ago', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={new Date()} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('day-chip-2'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(returned.getDate()).toBe(twoDaysAgo.getDate());
  });

  test('selecting a date chip 6 days back and confirming returns a date from 6 days ago', () => {
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={new Date()} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('day-chip-6'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    expect(returned.getDate()).toBe(sixDaysAgo.getDate());
    expect(returned.getMonth()).toBe(sixDaysAgo.getMonth());
    expect(returned.getFullYear()).toBe(sixDaysAgo.getFullYear());
  });
});

// ---------------------------------------------------------------------------
// Hour spinner
// ---------------------------------------------------------------------------

describe('DateTimePicker – hour spinner', () => {
  test('up-arrow increments the displayed hour', () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('hour-up'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(11);
  });

  test('hour wraps from 23 to 0 when incremented', () => {
    const base = new Date();
    base.setHours(23, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('hour-up'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(0);
  });

  test('hour wraps from 0 to 23 when decremented', () => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('hour-down'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(23);
  });
});

// ---------------------------------------------------------------------------
// Minute spinner
// ---------------------------------------------------------------------------

describe('DateTimePicker – minute spinner', () => {
  test('up-arrow increments minute by 5', () => {
    const base = new Date();
    base.setHours(10, 20, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('minute-up'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(25);
  });

  test('minute wraps from 55 to 0 when incremented', () => {
    const base = new Date();
    base.setHours(10, 55, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('minute-up'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(0);
  });

  test('down-arrow decrements minute by 5', () => {
    const base = new Date();
    base.setHours(10, 30, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('minute-down'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(25);
  });

  test('minute wraps from 0 to 55 when decremented', () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByTestId('minute-down'));
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(55);
  });
});

// ---------------------------------------------------------------------------
// Free-form text input for hour and minute
// ---------------------------------------------------------------------------

describe('DateTimePicker – direct text input', () => {
  test('typing a valid hour into the hour input updates the confirmed time', () => {
    const base = new Date();
    base.setHours(11, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByTestId('hour-input'), '9');
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(9);
  });

  test('typing a valid minute into the minute input updates the confirmed time', () => {
    const base = new Date();
    base.setHours(10, 7, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByTestId('minute-input'), '45');
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(45);
  });

  test('hour value above 23 is clamped to 23', () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByTestId('hour-input'), '25');
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(23);
  });

  test('minute value above 59 is clamped to 59', () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByTestId('minute-input'), '99');
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getMinutes()).toBe(59);
  });

  test('hour input re-pads to two digits on blur', () => {
    const base = new Date();
    base.setHours(11, 0, 0, 0);
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={jest.fn()} />
    );
    fireEvent.press(getByText('Edit'));
    const input = getByTestId('hour-input');
    fireEvent.changeText(input, '9');
    fireEvent(input, 'blur');
    expect(input.props.value).toBe('09');
  });

  test('non-numeric hour input leaves the previous valid hour unchanged', () => {
    const base = new Date();
    base.setHours(10, 0, 0, 0);
    const onChange = jest.fn();
    const { getByTestId, getByText } = render(
      <DateTimePicker value={base} onChange={onChange} />
    );
    fireEvent.press(getByText('Edit'));
    fireEvent.changeText(getByTestId('hour-input'), 'abc');
    fireEvent.press(getByText('Confirm'));

    const returned: Date = onChange.mock.calls[0][0];
    expect(returned.getHours()).toBe(10);
  });
});
