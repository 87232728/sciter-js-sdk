export class SublimatedEntity extends Element {
  // this.def.type;         // "Array", "Object", "Element", etc
  // this.def.length;    - if "Array"
  // this.def.reference;    // sublimated reference
  // this.def.elements   // if "Array"
  // this.def.properties // if object
  // this.def.caption    // toString() if object

  constructor(props) {
    super();
    this.channel = props.channel;
    this.expanded = props.expanded;
  }

  render(props) {
    if (props?.def)
      this.def = props.def;

    if (!this.def) return [];

    return this.doRender();
  }

  async requestDetails() {
    const details = await this.channel.request("objectElements", this.def.reference);
    if (this.def.type == "Array") {
      this.def.elements = details;
      this.componentUpdate();
    }
    else {
      this.def.properties = details;
      this.componentUpdate();
    }
  }

  ["on click at caption"](evt) {
    if (!this.expanded) {
      if (!this.def.elements && !this.def.properties)
        this.requestDetails();
      this.componentUpdate({expanded: true});
    }
    else
      this.componentUpdate({expanded: false});
    evt.stopPropagation();
  }
}

export class SublimatedArray extends SublimatedEntity {
  constructor(props) {
    super(props);
  }

  doRender() {
    let atts = {};
    let details = [];

    if (this.expanded) {
      atts = {expanded: ""};
      let n = 0;
      const list = [];
      for (const val of (this.def.elements || [])) {
        const key = (n++).toString();
        list.push(<span>{key} :</span>);
        list.push(SublimatedValue(this.channel, val, key));
        if (n > 10) {
          list.push(<text>{this.def.length - 10} elements more...</text>);
          break;
        }
      }
      details = <div .details>{list}</div>;
    }
    return <var .coll {atts} type={this.def.type}><caption>Array({this.def.length})</caption>{details}</var>;
  }
}

export class SublimatedObject extends SublimatedEntity {
  constructor(props) {
    super(props);
  }

  doRenderDetails() {

    let atts = {};
    let details = [];

    if (this.expanded) {
      atts = {expanded: ""};
      let n = 0;
      const list = [];
      if (this.def?.properties) {
        for (const [key, val] of Object.entries(this.def.properties)) {
          list.push(<span>{key} :</span>);
          list.push(SublimatedValue(this.channel, val, key));
          if (++n > 32) {
            list.push(<text>{this.def.length - 32} names more...</text>);
            break;
          }
        }
      }
      details = <div .details>{list}</div>;
    }
    return [atts,details]; 
  }

  doRender() {
    let [atts,details] = this.doRenderDetails();
    if (this.def.caption)
      return <var .coll {atts} type={this.def.type}><caption>{this.def.caption}</caption>{details}</var>;
    else
      return <var .coll {atts} type={this.def.type}><caption>Object</caption>{details}</var>;
  }
}

export class SublimatedElement extends SublimatedObject {
  doRender() {
    let [atts,details] = this.doRenderDetails();
    return <var .coll {atts} type={this.def.type}><caption><text>{this.def.caption}</text><icon|my-location /></caption>{details}</var>;
  }

  ["on click at icon"](evt) {
    const elementUid = this.def.uid;
    this.postEvent(new Event("navigate-to", {bubbles: true, data:elementUid}));
    return true;
  }
}


const RE_FILE_LINE = /[(](\w+:[^()]+(?:[:]\d+|[(]\d+[)]))[)]/g;


function crackText(text) {
  const t = text.split(RE_FILE_LINE);
  if (t.length == 1)
    return text;

  const content = [];
  for (let i = 0; i < t.length; ++i) {
    const chunk = t[i];
    if (!chunk) continue;
    if (i & 1) {
      const RE_URL_LINENO = /(\w+:[^()]+)(?:[:](\d+)|[(](\d+)[)])/g;
      const [src, url, ln1, ln2] = RE_URL_LINENO.exec(chunk);
      content.push(<a .location href={url} lineno={ln1 || ln2}>{chunk}</a>);
    }
    else
      content.push(chunk);
  }
  return content;
}

export function SublimatedValue(channel, val, key, forLog = false) {
  if (!key) key = `${val}`;

  if (val === null)
    return <var .null key={key}>null</var>;
  else if (val === undefined)
    return <var .undefined key={key}>undefined</var>;

  switch (typeof val) {
    case "string":
      return forLog ? <span .string key={key}>{crackText(val)}</span> :
        <var .string key={key}>{val}</var>;
    case "number":
      return <var .number key={key}>{val.toString()}</var>;
    case "bigint":
      return <var .number.big key={key}>{val.toString()}n</var>;
    case "object":
      if (val !== null)
        switch(val.type) {
          case "Array": return <SublimatedArray channel={channel} def={val} key={key} />;
          case "Element": return <SublimatedElement channel={channel} def={val} key={key} />;
          default: return <SublimatedObject channel={channel} def={val} key={key} />;
        }
      // else fall through
    default:
      return <var .other key={key}>{JSON.stringify(val)}</var>;
  }
}


