
# Procaser


To combine processing into a single callback function which can be handled by a switch-case statement.

```javascript

import {Procaser} from '@agoyu/procaser';

processJob(willSuccess) {
  /**
   * initial props
   * @type {object}
   */
  const myProps = {
    name: 'Potesuke',
    email: 'pote@example.com'
  };
  
  const myProc = new Procaser(
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
      }
    }
  );
}

/**
 * Send the signal to the processor after 2 seconds
 * @param {Procaser} proc 
 * @param {boolean} willSuccess 
 */
 requestProcess(proc) {
  setTimeout(() => {
    if (willSuccess) {
      proc.signal('success');
    } else {
      proc.signal('error');
    }
  }, 2 * 1000);
}

```
