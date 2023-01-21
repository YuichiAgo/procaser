
# Procaser

To combine processing into a single callback function which can be handled by a switch-case statement.

# Installation

```

npm i @agoyu/procaser

```

# Usage

```javascript

import {Procaser} from '@agoyu/procaser';

  new Procaser(null, (proc, step, props) => {
    switch (step) {
      case proc.BOOT:
        proc.next('MyStep');
        break;
      case 'start@MyStep':
        // write your process management
        // ...
      case proc.EXIT:
        break;
    }
  });

```

# Example

```javascript

processJob(willSuccess) {
  const myProps = {
    name: 'Potesuke',
    email: 'pote@example.com'
  };
  
  const caser = new Procaser(
    myProps,
    (proc, step, props) => {
      console.log('step:' + step);
      switch (step) {
        case proc.BOOT:
          proc.next('Process');
          break;

        case 'start@Process':
          this.showProgressPopup({
            title: 'Processing',
            caption: 'Please Wait',
          });
          this.requestProcess(proc, willSuccess);
          break;
        case 'end@Process':
          this.showProgressPopup(false);
          break;
        case 'success@Process':
          proc.next('Complete');
          break;
        case 'failed@Process':
          proc.next('Failed');
          break;

        case 'start@Complete':
          this.showConfirmPopup(
            {
              title: 'Process succeeded',
              caption: 'You made it!',
              yes: 'OK',
              no: false,
            },
            proc);
          break;
        case 'end@Complete':
          this.showConfirmPopup(false);
          break;
        case 'confirm@Complete':
          proc.exit();
          break;

        case 'start@Failed':
          this.showConfirmPopup(
            {
              title: 'Process failed',
              caption: 'Try again!',
              yes: 'OK',
              no: false,
            },
            proc);
          break;
        case 'end@Failed':
          this.showConfirmPopup(false);
          break;
        case 'confirm@Failed':
          proc.exit();
          break;
        
        case proc.EXIT:
          break;
      }
    }
  );
}

/**
 * Send the signal to the Procaser after 2 seconds
 * @param {Procaser} proc 
 * @param {boolean} willSuccess 
 */
 requestProcess(proc, willSuccess) {
  setTimeout(() => {
    if (willSuccess) {
      proc.signal('success');
    } else {
      proc.signal('error');
    }
  }, 2 * 1000);
}

```

# Methods

## constructor

constructor

### Parameters

*   `props` **([object][20] | null)** The object you can deal with in the Procaser instance. (optional, default `{}`)
*   `callback` **[Function][21]** Function to be called back when the step or state is changed (optional, default `(step:string,proc:Procaser,props:object)=>{}`)

## next

Moving on to the next step, the callback passes through "end@currentStep" and "start@nextStep" case statements

### Parameters

*   `stepName` **([string][19] | [undefined][22])** Next step name
*   `props` **[object][20]** Values to be assigned to the properties (optional, default `{}`)
*   `wait` **[number][23]** Millisecond time before the callback on the next step starting. If negative, immediately. (optional, default `-1`)

Returns **this**&#x20;

## exit

Terminates the process, the callback passes through "end@currentStep" and proc.EXIT case statements

Returns **this**&#x20;

## signal

Apply state to the current step, the callback passes through "yourState@currentStep" case statement

### Parameters

*   `state` **[string][19]** Any state name
*   `props` **[object][20]** Values to be assigned to the properties (optional, default `{}`)
*   `wait` **[number][23]** Millisecond time before the callback passes through the "yourState@currentStep" case statement. If negative, immediately. (optional, default `-1`)

Returns **this**&#x20;

## confirm

Apply the 'confirm' state to the current step, the callback passes through "confirm@currentStep" case statement

### Parameters

*   `props` **[object][20]** Values to be assigned to the properties (optional, default `{}`)
*   `wait` **[number][23]** Millisecond time before the callback passes through the "confirm@currentStep" case statement. If negative, immediately. (optional, default `-1`)

Returns **this**&#x20;

## cancel

Apply the 'cancel' state to the current step, the callback passes through "cancel@currentStep" case statement

### Parameters

*   `props` **[object][20]** Values to be assigned to the properties (optional, default `{}`)
*   `wait` **[number][23]** Millisecond time before the callback passes through the "cancel@currentStep" case statement. If negative, immediately. (optional, default `-1`)

Returns **this**&#x20;

## error

Apply the 'error' state to the current step, the callback passes through "error@currentStep" case statement

### Parameters

*   `stepName` **[string][19]**&#x20;
*   `props` **[object][20]** Values to be assigned to the properties (optional, default `{}`)
*   `wait` **[number][23]** Millisecond time before the callback passes through the "error@currentStep" case statement. If negative, immediately. (optional, default `-1`)

Returns **this**&#x20;

[1]: #boot

[2]: #exit

[3]: #confirm

[4]: #cancel

[5]: #error

[6]: #constructor

[7]: #parameters

[8]: #next

[9]: #parameters-1

[10]: #exit-1

[11]: #signal

[12]: #parameters-2

[13]: #confirm-1

[14]: #parameters-3

[15]: #cancel-1

[16]: #parameters-4

[17]: #error-1

[18]: #parameters-5

[19]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[20]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[21]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[22]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/undefined

[23]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Number
