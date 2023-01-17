interface StepState {
  name: string | undefined;
  state: string | undefined;
  wait: number;
}

export class Procaser {
  private readonly _callback: Function;
  private _stepString: string | undefined;
  private _currentStepName: string | undefined;
  private _savedStep: string | undefined;
  private readonly _nextSteps: StepState[] = [];
  private readonly _props: object = {};
  private _exited = false;
  private _inCallBack = false;
  private _stackCt = 0;
  BOOT = 'BOOT';
  EXIT = 'EXIT';
  START = 'start';
  END = 'end';
  CONFIRM = 'confirm';
  CANCEL = 'cancel';
  ERROR = 'error';
  MAX_STACK = 10;

  /**
   * constructor
   * @param props Property object dealt with in the procaser instance
   * @param callback Function to be called back when a step or state is changed
   */
  constructor(
    props: object | null = {},
    callback: Function = (step: string, proc: Procaser, props: object) => {}
  ) {
    if (props !== null) {
      this._props = props;
    }
    this._callback = callback;
    this._exited = false;
    this._savedStep = undefined;
    this._inCallBack = false;
    this._stackCt = 0;

    this._onBoot();
  }

  private _onBoot(): void {
    this._currentStepName = this._stepString = this.BOOT;
    this._doCallBack();
    void this._execSteps();
  }

  private _doCallBack(): void {
    this._inCallBack = true;
    this._stackCt++;
    this._callback(this, this._stepString, this._props);
    this._stackCt--;
    this._inCallBack = false;

    if (this._stackCt > this.MAX_STACK) {
      console.warn(`callback stack exceeded ${this.MAX_STACK}`);
      this.exit();
    }
  }

  private _nextStepStates(): StepState[] | undefined {
    if (this._nextSteps.length === 0) {
      return undefined;
    }

    const arr: StepState[] = this._nextSteps.splice(0, 1);
    const nextState: StepState = arr[0];

    if (nextState.state !== undefined) {
      return [nextState];
    }

    if (this._currentStepName === nextState.name) {
      return undefined;
    }
    const endStep = {
      name: this._currentStepName,
      state: 'end',
      wait: -1,
    };
    const startStep = {
      name: nextState.name,
      state: 'start',
      wait: nextState.wait,
    };
    this._currentStepName = nextState.name;
    // console.log(`proc.changing: ${endStep.name} => ${startStep.name}`);
    return [...(endStep.name !== this.BOOT ? [endStep] : []), startStep];
  }

  private async _execSteps(): Promise<void> {
    while (!this._exited) {
      const steps: StepState[] | undefined = this._nextStepStates();
      if (steps == null || steps.length === 0) {
        break;
      }

      for (const step of steps) {
        if (step.name === undefined) {
          this._exited = true;
          this._currentStepName = this._stepString = this.EXIT;
          this._doCallBack();
          break;
        }

        this._stepString = `${step.state ?? '---'}@${step.name}`;
        if (step.wait < 0) {
          this._doCallBack();
        } else {
          await new Promise((resolve) => {
            setTimeout(() => {
              resolve('waited');
            }, step.wait);
          });
          this._doCallBack();
        }
      }
    }

    if (this._exited) {
      this._nextSteps.length = 0;
    }
  }

  assignProps(props: object = {}): void {
    Object.assign(this._props, props);
  }

  /**
   * Moving on to the next step
   * @param stepName Next step name
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the next step starting. If negative, immediately.
   * @returns Step transition accepted
   */
  next(
    stepName: string | undefined,
    props: object = {},
    wait: number = -1
  ): boolean {
    if (this._exited) {
      return false;
    }
    this.assignProps(props);
    this._nextSteps.push({
      name: stepName,
      state: undefined,
      wait,
    });
    if (!this._inCallBack) {
      void this._execSteps();
    }
    return true;
  }

  /**
   * Terminates the process, at which time the current step end and exit are called
   */
  exit(): void {
    this.next(undefined);
    void this._execSteps();
  }

  private _respond(
    stepName: string | undefined,
    state: string | undefined,
    props: object = {},
    wait: number = -1
  ): boolean {
    if (this._exited) {
      return false;
    }
    this._nextSteps.push({
      name: stepName,
      state,
      wait,
    });
    this.assignProps(props);
    void this._execSteps();
    return true;
  }

  /**
   * Apply state to the current step.
   * @param state Any state name
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the signaled step starting. If negative, immediately.
   */
  signal(state: string, props: object = {}, wait: number = -1): void {
    this._respond(this._currentStepName, state, props, wait);
  }

  /**
   * Apply the 'confirm' state to the current step.
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the signaled step starting. If negative, immediately.
   */
  confirm(props: object = {}, wait: number = -1): void {
    this._respond(this._currentStepName, this.CONFIRM, props, wait);
  }

  /**
   * Apply the 'cancel' state to the current step.
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the signaled step starting. If negative, immediately.
   */
  cancel(props: object = {}, wait: number = -1): void {
    this._respond(this._currentStepName, this.CANCEL, props, wait);
  }

  /**
   * Apply the 'error' state to the current step.
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the signaled step starting. If negative, immediately.
   */
  error(stepName: string, props: object = {}, wait: number = -1): void {
    this._respond(stepName, this.ERROR, props, wait);
  }

  saveCurrentStep(): void {
    this._savedStep = this._stepString;
  }

  savedStep(): string | undefined {
    return this._savedStep;
  }

  defaultWarn(): void {
    console.warn(
      `Procaser: step "${this._stepString ?? '*null*'}" was not processed.`
    );
  }
}
