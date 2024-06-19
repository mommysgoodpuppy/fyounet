export class Actor {
  name: string;
  protected _actorid: string;
  location: string = "";

  constructor(name: string) {
    this._actorid = name + crypto.randomUUID();
    this.name = name;
  }

  public get actorid(): string {
    return this._actorid;
  }
}
