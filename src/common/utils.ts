export class SimpleKeyboardEventListener implements EventListenerObject{
  constructor(private func:(evt:KeyboardEvent)=>any) {}
  handleEvent(evt: KeyboardEvent): void {
    this.func(evt);
  }
}
