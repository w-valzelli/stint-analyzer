import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CustomSelect, type CustomSelectOption } from '../../src/components/reusable/CustomSelect';

const ALL = '__all__';

const options: readonly CustomSelectOption[] = [
  { value: 'one', label: 'One', detail: 'First' },
  { value: 'two', label: 'Two' },
  { value: 'three', label: 'Three' },
];

type HarnessProps = {
  initial: string | string[];
  multiple?: boolean;
  withAll?: boolean;
  onChange?: (value: string | string[]) => void;
};

function SelectHarness({ initial, multiple = false, withAll = false, onChange }: HarnessProps) {
  const [value, setValue] = useState<string | string[]>(initial);
  const harnessOptions = withAll ? [{ value: ALL, label: 'All' }, ...options] : options;

  return (
    <>
      <CustomSelect
        label="Choice"
        value={value}
        options={harnessOptions}
        multiple={multiple}
        allOptionValue={withAll ? ALL : undefined}
        onChange={(next) => {
          onChange?.(next);
          setValue(next);
        }}
      />
      <button type="button">Outside</button>
    </>
  );
}

function trigger(): HTMLElement {
  return screen.getByRole('button', { name: 'Choice' });
}

describe('CustomSelect', () => {
  afterEach(() => cleanup());

  it('opens a portaled listbox and selects one option in single mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectHarness initial="one" onChange={onChange} />);

    expect(trigger()).toHaveTextContent('One');
    expect(trigger()).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger());
    const listbox = screen.getByRole('listbox', { name: 'Choice options' });
    expect(listbox.parentElement).toBe(document.body);
    expect(listbox).not.toHaveAttribute('aria-multiselectable');
    expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: /One/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: /Two/ }));

    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveTextContent('Two');
    expect(trigger()).toHaveFocus();
  });

  it('toggles several options in multiple mode while staying open', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SelectHarness initial={['one']} multiple onChange={onChange} />);

    await user.click(trigger());
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');

    await user.click(screen.getByRole('option', { name: /Three/ }));
    expect(onChange).toHaveBeenLastCalledWith(['one', 'three']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /One/ }));
    expect(onChange).toHaveBeenLastCalledWith(['three']);
    expect(screen.getByRole('option', { name: /Three/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /One/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('clears and restores every option through the all option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SelectHarness initial={['one', 'two', 'three']} multiple withAll onChange={onChange} />,
    );

    await user.click(trigger());
    expect(screen.getByRole('option', { name: /All/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('option', { name: /All/ }));
    expect(onChange).toHaveBeenLastCalledWith([]);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();

    await user.click(trigger());
    expect(screen.getByRole('option', { name: /All/ })).toHaveAttribute('aria-selected', 'false');

    await user.click(screen.getByRole('option', { name: /All/ }));
    expect(onChange).toHaveBeenLastCalledWith(['one', 'two', 'three']);
  });

  it('navigates options with the arrow, Home, and End keys', async () => {
    const user = userEvent.setup();
    render(<SelectHarness initial="two" />);

    trigger().focus();
    await user.keyboard('{ArrowDown}');
    const optionTwo = await screen.findByRole('option', { name: /Two/ });
    await vi.waitFor(() => expect(optionTwo).toHaveFocus());
    expect(optionTwo).toHaveAttribute('tabindex', '0');

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Three/ })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /One/ })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: /Three/ })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('option', { name: /One/ })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: /Three/ })).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(trigger()).toHaveTextContent('Three');
    expect(trigger()).toHaveFocus();
  });

  it('dismisses with Escape and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(<SelectHarness initial="one" />);

    await user.click(trigger());
    await vi.waitFor(() => expect(screen.getByRole('option', { name: /One/ })).toHaveFocus());

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    expect(trigger()).toHaveFocus();
  });

  it('dismisses on an outside press and restores trigger focus', async () => {
    const user = userEvent.setup();
    render(<SelectHarness initial="one" />);

    await user.click(trigger());
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });

  it('closes when the open trigger is pressed again', async () => {
    const user = userEvent.setup();
    render(<SelectHarness initial="one" />);

    await user.click(trigger());
    await user.click(trigger());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
  });
});
