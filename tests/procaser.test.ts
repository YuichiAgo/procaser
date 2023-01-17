import { Procaser } from '../src/index';

afterEach(() => {
  // restore the spy created with spyOn
  jest.restoreAllMocks();
});

test('wait timer', async () => {
  const request = async (proc: Procaser): Promise<void> => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        proc.confirm();
        resolve('success');
      }, 1 * 1000);
    });
  };
  const progress = {
    shown: false,
    title: null,
    show(values: any | boolean) {
      if (!values) {
        this.shown = false;
      } else {
        const { title = 'Title' } = values;
        this.title = title;
        this.shown = true;
      }
    },
  };

  const _history: string[] = [];
  const proc = new Procaser(
    null,
    (proc: Procaser, step: string, props: object) => {
      _history.push(step);
      switch (step) {
        case proc.BOOT:
          proc.next('Request');
          break;
        case 'start@Request':
          progress.show({ title: 'Processing' });
          void request(proc);
          break;
        case 'confirm@Request':
          proc.next('Success');
          break;
        case 'end@Request':
          break;

        case 'start@Success':
          progress.show({ title: 'Success' });
          proc.next('Complete', {}, 1 * 1000);
          break;
        case 'end@Success':
          break;

        case 'start@Complete':
          proc.exit();
          break;
        case 'end@Complete':
          break;

        case proc.EXIT:
          progress.show(false);
          break;
        default:
          _history.push(`"${step}" was not processed`);
          break;
      }
    }
  );
  expect(progress.shown).toBe(true);
  expect(progress.title).toBe('Processing');
  await new Promise((r) => setTimeout(r, 0.9 * 1000));
  expect(progress.title).toBe('Processing');
  await new Promise((r) => setTimeout(r, 0.2 * 1000)); // 1.1
  expect(progress.shown).toBe(true);
  expect(progress.title).toBe('Success');
  await new Promise((r) => setTimeout(r, 0.8 * 1000)); // 1.9
  expect(progress.shown).toBe(true);
  expect(progress.title).toBe('Success');
  await new Promise((r) => setTimeout(r, 0.2 * 1000)); // 2.1
  expect(progress.shown).toBe(false);

  expect(_history).toStrictEqual([
    proc.BOOT,
    'start@Request',
    'confirm@Request',
    'end@Request',
    'start@Success',
    'end@Success',
    'start@Complete',
    'end@Complete',
    proc.EXIT,
  ]);
});

test('popup response', async () => {
  const panel = {
    click(proc: Procaser) {
      proc.goTo('Confirm');
    },
  };
  const popup = {
    shown: false,
    title: null,
    show(values: any | boolean) {
      if (!values) {
        this.shown = false;
      } else {
        const { title = 'Title' } = values;
        this.title = title;
        this.shown = true;
      }
    },
    pushButton(proc: Procaser, agrees: boolean) {
      if (agrees) {
        proc.confirm({ agreed: true });
      } else {
        proc.cancel();
      }
    },
  };

  const _history: string[] = [];
  const proc = new Procaser(
    null,
    (proc: Procaser, step: string, props: object) => {
      _history.push(step);
      switch (step) {
        case proc.BOOT:
          proc.next('Await');
          break;
        case 'start@Await':
          proc.next('Await');
          break;
        case 'end@Await':
          break;

        case 'start@Confirm':
          popup.show({ title: 'Agreements' });
          break;
        case 'end@Confirm':
          popup.show(false);
          break;
        case 'confirm@Confirm':
          proc.next('Confirmed');
          break;
        case 'cancel@Confirm':
          proc.next('Await');
          break;

        case 'start@Confirmed':
          proc.next('Await');
          break;
        case 'end@Confirmed':
          break;

        case proc.EXIT:
          break;
        default:
          _history.push(`"${step}" was not processed`);
          break;
      }
    }
  );

  expect(popup.shown).toBe(false);

  panel.click(proc); // show popup
  expect(popup.shown).toBe(true);
  popup.pushButton(proc, true); // push confirm button
  await new Promise((r) => setTimeout(r, 0.05 * 1000));
  expect(popup.shown).toBe(false);

  panel.click(proc); // show popup again
  await new Promise((r) => setTimeout(r, 0.05 * 1000));
  expect(popup.shown).toBe(true);
  popup.pushButton(proc, false); // push cancel button
  await new Promise((r) => setTimeout(r, 0.05 * 1000));
  expect(popup.shown).toBe(false);

  proc.exit();

  expect(_history).toStrictEqual([
    proc.BOOT,
    'start@Await',
    'end@Await',
    'start@Confirm',
    'confirm@Confirm',
    'end@Confirm',
    'start@Confirmed',
    'end@Confirmed',
    'start@Await',
    'end@Await',
    'start@Confirm',
    'cancel@Confirm',
    'end@Confirm',
    'start@Await',
    'end@Await',
    proc.EXIT,
  ]);
});

test('booted', () => {
  let procStep: string = '';
  let procProps: object | undefined;
  const proc = new Procaser(
    null,
    (proc: Procaser, step: string, props: object) => {
      procStep = step;
      procProps = props;
    }
  );
  expect(procStep).toBe(proc.BOOT);
  expect(procProps).toStrictEqual({});
});

test('after exited', () => {
  const _history: string[] = [];
  let procProps: object | undefined;
  const proc = new Procaser(
    {},
    (proc: Procaser, step: string, props: object) => {
      _history.push(step);
      switch (step) {
        case proc.BOOT:
          proc.exit();
          break;
        case proc.EXIT:
          proc.next('Regret', { rewind: true });
          break;
        case 'start@Regret':
          break;
      }
      procProps = props;
    }
  );
  expect(_history).toStrictEqual([proc.BOOT, proc.EXIT]);
  expect(procProps).toStrictEqual({});
});

test('first step', () => {
  let procStep: string = '';
  let procProps: object | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  new Procaser(
    { name: 'Potesuke', email: 'pote@example.com' },
    (proc: Procaser, step: string, props: object) => {
      switch (step) {
        case proc.BOOT:
          proc.next('Prepare');
          break;
        case 'start@Prepare':
          break;
      }
      procStep = step;
      procProps = props;
    }
  );
  expect(procStep).toBe('start@Prepare');
  expect(procProps).toStrictEqual({
    name: 'Potesuke',
    email: 'pote@example.com',
  });
});

test('props', () => {
  const obj = { name: 'Potesuke', email: 'pote@example.com' };
  new Procaser(obj, (proc: Procaser, step: string, props: object) => {
    switch (step) {
      case proc.BOOT:
        expect(props).toStrictEqual({
          name: 'Potesuke',
          email: 'pote@example.com',
        });
        proc.next('Prepare', { prepared: true });
        break;
      case 'start@Prepare':
        expect(props).toStrictEqual({
          prepared: true,
          name: 'Potesuke',
          email: 'pote@example.com',
        });
        proc.next('Write', { content: 'no idea', prepared: false });
        break;
      case 'start@Write':
        expect(props).toStrictEqual({
          prepared: false,
          name: 'Potesuke',
          email: 'pote@example.com',
          content: 'no idea',
        });
        proc.exit();
        break;
    }
  });
});

test('step array', () => {
  const _history: string[] = [];
  const proc = new Procaser(
    null,
    (proc: Procaser, step: string, props: object) => {
      _history.push(step);
      switch (step) {
        case proc.BOOT:
          proc.next('Prepare');
          break;
        case 'start@Prepare':
          proc.next('Work');
          break;
        case 'end@Prepare':
          break;
        case 'start@Work':
          proc.exit();
          break;
        case 'end@Work':
          break;
        case proc.EXIT:
          break;
        default:
          _history.push(`"${step}" was not processed`);
          break;
      }
    }
  );
  expect(_history).toStrictEqual([
    proc.BOOT,
    'start@Prepare',
    'end@Prepare',
    'start@Work',
    'end@Work',
    proc.EXIT,
  ]);
});

test('infinite loop', () => {
  new Procaser(
    {
      leftCt: 0,
      rightCt: 0,
    },
    (proc: Procaser, step: string, props: any) => {
      switch (step) {
        case proc.BOOT:
          proc.next('Left');
          break;

        case 'start@Left':
          proc.assignProps({ leftCt: props.leftCt + 1 });
          proc.next('Right');
          break;
        case 'start@Right':
          proc.assignProps({ rightCt: props.rightCt + 1 });
          if (props.rightCt > 10) {
            proc.exit();
          } else {
            proc.next('Left');
          }
          break;

        case proc.EXIT:
          break;
      }
    }
  );
});
