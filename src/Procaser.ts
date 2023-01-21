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
  private static readonly _BOOT = 'BOOT';
  private static readonly _EXIT = 'EXIT';
  private static readonly _START = 'start';
  private static readonly _END = 'end';
  private static readonly _CONFIRM = 'confirm';
  private static readonly _CANCEL = 'cancel';
  private static readonly _ERROR = 'error';
  private static readonly _MAX_STACK = 10;

  /**
   * returns 'BOOT'
   */
  get BOOT(): string {
    return Procaser._BOOT;
  }

  /**
   * returns 'EXIT'
   */
  get EXIT(): string {
    return Procaser._EXIT;
  }

  /**
   * returns 'confirm'
   */
  get CONFIRM(): string {
    return Procaser._CONFIRM;
  }

  /**
   * returns 'cancel'
   */
  get CANCEL(): string {
    return Procaser._CANCEL;
  }

  /**
   * returns 'error'
   */
  get ERROR(): string {
    return Procaser._ERROR;
  }

  /**
   * constructor
   * @param props The object you can deal with in the Procaser instance.
   * @param callback Function to be called back when the step or state is changed
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

  private _onBoot(): this {
    this._currentStepName = this._stepString = this.BOOT;
    this._doCallBack();
    void this._execSteps();
    return this;
  }

  private _doCallBack(): this {
    this._inCallBack = true;
    this._stackCt++;
    this._callback(this, this._stepString, this._props);
    this._stackCt--;
    this._inCallBack = false;

    if (this._stackCt > Procaser._MAX_STACK) {
      console.warn(`callback stack exceeded ${Procaser._MAX_STACK}`);
      this.exit();
    }
    return this;
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
      state: Procaser._END,
      wait: -1,
    };
    const startStep = {
      name: nextState.name,
      state: Procaser._START,
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

  assignProps(props: object = {}): this {
    Object.assign(this._props, props);
    return this;
  }

  /**
   * Moving on to the next step, the callback passes through "end@currentStep" and "start@nextStep" case statements
   * @param stepName Next step name
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback on the next step starting. If negative, immediately.
   * @returns this
   */
  next(
    stepName: string | undefined,
    props: object = {},
    wait: number = -1
  ): this {
    if (this._exited) {
      return this;
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
    return this;
  }

  /**
   * Terminates the process, the callback passes through "end@currentStep" and proc.EXIT case statements
   * @returns this
   */
  exit(): this {
    this.next(undefined);
    void this._execSteps();
    return this;
  }

  private _respond(
    stepName: string | undefined,
    state: string | undefined,
    props: object = {},
    wait: number = -1
  ): this {
    if (this._exited) {
      return this;
    }
    this._nextSteps.push({
      name: stepName,
      state,
      wait,
    });
    this.assignProps(props);
    void this._execSteps();
    return this;
  }

  /**
   * Apply state to the current step, the callback passes through "yourState@currentStep" case statement
   * @param state Any state name
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback passes through the "yourState@currentStep" case statement. If negative, immediately.
   */
  signal(state: string, props: object = {}, wait: number = -1): this {
    return this._respond(this._currentStepName, state, props, wait);
  }

  /**
   * Apply the 'confirm' state to the current step, the callback passes through "confirm@currentStep" case statement
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback passes through the "confirm@currentStep" case statement. If negative, immediately.
   */
  confirm(props: object = {}, wait: number = -1): this {
    return this._respond(this._currentStepName, this.CONFIRM, props, wait);
  }

  /**
   * Apply the 'cancel' state to the current step, the callback passes through "cancel@currentStep" case statement
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback passes through the "cancel@currentStep" case statement. If negative, immediately.
   */
  cancel(props: object = {}, wait: number = -1): this {
    return this._respond(this._currentStepName, this.CANCEL, props, wait);
  }

  /**
   * Apply the 'error' state to the current step, the callback passes through "error@currentStep" case statement
   * @param props Values to be assigned to the properties
   * @param wait Millisecond time before the callback passes through the "error@currentStep" case statement. If negative, immediately.
   */
  error(stepName: string, props: object = {}, wait: number = -1): this {
    return this._respond(stepName, this.ERROR, props, wait);
  }

  saveCurrentStep(): this {
    this._savedStep = this._stepString;
    return this;
  }

  savedStep(): string | undefined {
    return this._savedStep;
  }

  defaultWarn(): this {
    console.warn(
      `Procaser: step "${this._stepString ?? '*null*'}" was not processed.`
    );
    return this;
  }
}
