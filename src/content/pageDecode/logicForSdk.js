export function logicForMonad() {
  const luxButtonSwitcher = document.querySelector(
    '.lux-button-switcher.always'
  );
  if (luxButtonSwitcher) {
    const segments = luxButtonSwitcher.querySelector('.segments');
    if (segments) {
      const buttons= segments.querySelectorAll('button');
      if (buttons[1]) {
        buttons[1].click();
      } else {
        console.log('The button element was not found.');
      }
    } else {
      console.log('The element with the class name "segments" was not found.');
    }
  }
}
