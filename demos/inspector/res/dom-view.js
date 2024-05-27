import {View} from "view.js";
import * as Settings from "settings.js";

export class DOMView extends View {
  constructor(props) {
    super(props, "DOMView");
  }

  componentDidMount() {
    if (!this.viewstate.stack)
      this.loadInitialContent();
    this.channel.onStackHighlight = (stack) => this.showStack(stack);
    this.channel.onContentChange = () => this.reloadContent();
  }

  componentWillUnmount() {
    this.channel.onStackHighlight = null;
  }

  async getContentOf(nd) {
    if (!nd) return;
    const content = await this.channel.request("contentOf", nd.uid);
    if (typeof content == "string")
      nd.text = content;
    else if (content) {
      nd.children = content;
      for (const ch of nd.children) {
        if (typeof ch == "object")
          ch.parent = nd;
      }
    }
    return content;
  }

  async loadInitialContent() {
    try {
      const stack = await this.channel.request("stackOf", null);
      this.viewstate.stack = stack;
      const root = stack[0];

      // root is null at startup before the connection
      const rootContent = await this.getContentOf(root);

      let body = null;

      if (!rootContent) return;

      for (const rn of rootContent) {
        if (rn.tag == "body") {
          await this.getContentOf(body = rn);
          break;
        }
      }

      this.componentUpdate();
    }
    catch (e) {
      console.error("loadInitialContent:", e, e?.stack);
    }
  }

  async showStack(stack) {
    for (let i = 1; i < stack.length; ++i) {
      const p = stack[i - 1];
      const c = stack[i];
      await this.getContentOf(p);
      if (p.children) {
        for (let n = 0; n < p.children.length; ++n) {
          if (p.children[n].uid == c.uid) {
            p.children[n] = c;
            c.parent = p;
            break;
          }
        }
      }
    }

    const copt = this.$("option:current");
    if (copt) copt.state.current = false;
    this.viewstate.stack = stack;
    this.dispatchEvent(new Event("domstackchange", {bubbles: true}), true);
  }

  async reloadElement(el) {
    if (el.children)
      await this.getContentOf(el);
    if (el.children) {
      for (const ch of el.children)
        this.reloadElement(ch);
    }

    this.componentUpdate();
  }

  async reloadContent() {
    const nstack = await this.channel.request("stackOf", null);
    if (nstack.uid != this.root.uid)
      this.loadInitialContent();
    else {
      this.reloadElement(this.root);
      this.componentUpdate();
    }
  }

  render() {
    if (!this.channel.connected)
      return <div></div>;

    function atts(nd) {
      const list = [];
      for (const n in nd.atts) {
        switch (n) {
          case "id": list.push(<span .id>#{nd.atts[n]}</span>); break;
          case "class": list.push(<span .class>.{nd.atts[n].replaceAll(" ", ".")}</span>); break;
          case "type": list.unshift(<span .type>|{nd.atts[n]}</span>); break;
          case "name": list.push(<span .name>({nd.atts[n]})</span>); break;
          default: list.push(<span .attr>{n}="{nd.atts[n]}"</span>); break;
        }
      }
      return list;
    }

    function caption(nd, open) {
      if (open)
        return <caption><span .tag>{"<"+nd.tag}{atts(nd)}{">"}</span></caption>;
      else {
        const text = nd.length ? "…" : nd.text;
        return <caption><span .tag>{"<"+nd.tag}{atts(nd)}{">"}</span>{text}<span .tag>{"</"+nd.tag+">"}</span></caption>;
      }
    }

    function option(nd, curr) {
      if (typeof nd == "string")
        return <option key={nd} state-current={nd===curr}><caption>"{nd}"</caption></option>;
      else if (nd.length == 0)
        return <option key={nd.uid} state-current={nd===curr}>{caption(nd, false)}</option>;


      const children = [];
      if (nd.children)
        for (const ch of nd.children)
          children.push(option(ch, curr));

      const open = children.length > 0;
      return <option key={nd.uid} state-expanded={open} state-current={nd===curr}>{caption(nd, open)}{children}</option>;
    }

    const curr = this.current;
    const nodes = this.root ? option(this.root, curr) : [];
    // if(curr)
    //  console.log("C", curr, curr.uid, this.root);
    return <select|tree treelines="" styleset="facade.css#dom-tree">{nodes}</select>;
  }

  get root() {
    return this.viewstate?.stack?.[0];
  }

  get current() {
    return this.viewstate?.stack?.last;
  }

  findTheirNodeByUID(UID, nd) {
    if (nd.uid == UID) return nd;
    if (nd.children) {
      for (const cnd of nd.children) {
        const found = this.findTheirNodeByUID(UID, cnd);
        if (found) return found;
      }
    }

    return null;
  }

  ["on collapse at option"](evt, option) {
    const UID = option.getAttribute("key");
    const found = this.findTheirNodeByUID(UID, this.root);
    if (found)
      found.children = null;
    this.componentUpdate();
  }

  async ["on expand at option"](evt, option) {
    const UID = option.getAttribute("key");
    const found = this.findTheirNodeByUID(UID, this.root);
    if (found) {
      await this.getContentOf(found);
      this.componentUpdate();
    }
  }

  ["on change"](evt) {
    const UID = this.value;
    const found = this.findTheirNodeByUID(UID, this.root);
    if (found) {
      this.channel.notify("highlightElement", UID);
      const stack = [found];
      for (let pn = found.parent; pn; pn = pn.parent)
        stack.unshift(pn);
      this.viewstate.stack = stack;
      this.dispatchEvent(new Event("domstackchange", {bubbles: true}), true);
    }
    return false;
  }

  static header(channel) {
    if (!channel.connected)
      return <div/>;

    const list = [];

    function atts(se) {
      const id = se.atts.id;
      return id ? <span .id>#{id}</span> : [];
    }

    const stack = channel.viewstate.DOMView?.stack;
    if (stack) {
      for (const se of stack)
        list.push(<span .tag>{se.tag}{atts(se)}</span>);
    }

    return <div #dom-stack styleset="facade.css#dom-stack">{list}</div>;
  }
}

class ElementMetrics extends View {
  metrics = null;

  constructor(props) {
    super(props, "DOMView");
  }

  render() {
    this.metrics = this.viewstate.elementDetails?.metrics;

    if (!this.metrics) return <section #metrics />;

    const {margin, padding, border, inner, content, dppx} = this.metrics;

    const pxunits = this.viewstate.units == "ppx";

    function u(val) {
      if (!val) return "-";
      if (pxunits) val /= dppx;
      return val.toString();
    }

    return <section styleset="facade.css#element-metrics">
      <header>Units:
        <button|radio .units value="ppx" state-checked={!this.viewstate.units || this.viewstate.units=="ppx"}>screen px</button>
        <button|radio .units value="px" state-checked={this.viewstate.units=="px"}>css px</button>
      </header>
      <div.box.margin>    
        <var>{u(margin[1])}</var>
        <var>{u(margin[0])}</var>
        <var>{u(margin[2])}</var>
        <var>{u(margin[3])}</var>
        <div .box.border>    
          <var>{u(border[1])}</var>
          <var>{u(border[0])}</var>
          <var>{u(border[2])}</var>
          <var>{u(border[3])}</var>
          <div .box.padding>
            <var>{u(padding[1])}</var>
            <var>{u(padding[0])}</var>
            <var>{u(padding[2])}</var>
            <var>{u(padding[3])}</var>
            <div .inner><var>{u(inner[2])}</var>x<var>{u(inner[3])}</var></div>
          </div>     
        </div>     
      </div>
      <dl.content>
        <dt>width min</dt><dd><var>{u(content[0])}</var></dd><dt>max</dt><dd><var>{u(content[2])}</var></dd>
        <dt>height min</dt><dd><var>{u(content[1])}</var></dd><dt>max</dt><dd><var>{u(content[3])}</var></dd>
      </dl>
    </section>;
  }

  ["on click at button.units"](evt, button) {
    this.viewstate.units = button.getAttribute("value");
    Settings.saveState();
    this.componentUpdate();
    return true;
  }
}

class ElementStates extends View {
  estates = null;

  constructor(props) {
    super(props, "DOMView");
  }

  render() {
    this.estates = this.viewstate.elementDetails?.states;

    if (!this.estates) return <section />;

    const states = this.estates.map( state => <span.state>{state}</span> );

    return <section styleset="facade.css#element-states">
      <span>states:</span>{ states }
    </section>;
  }
}


export class ElementDetailsView extends View {
  constructor(props) {
    super(props, "DOMView");
  }

  checkDetails() {
    const fetch = async () => {
      const content = await this.channel.request("detailsOf", this.viewstate.currentUid);
      this.viewstate.elementDetails = content;
      // console.log(JSON.stringify(this.viewstate.elementDetails));
      this.componentUpdate();
    };
    const current = this.viewstate.stack?.last;
    if (current && (this.viewstate.currentUid != current.uid)) {
      this.viewstate.currentUid = current.uid;
      fetch();
    }
  }

  render() {
    if (!this.channel.connected)
      return <div></div>;

    this.checkDetails();

    const list = [];

    const ctab = this.currentTab;

    if (this.viewstate.elementDetails) {
      function namvals(map) {
        return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
      }

      function fval(val) {
        if(Array.isArray(val))
          return val.join(" ");
        return val;
      }

      switch (ctab) {
        case "used":
          for (const [prop, val] of namvals(this.viewstate.elementDetails.usedStyleProperties)) {
            list.push(<dt>{prop}</dt>);
            list.push(<dd>{fval(val)}</dd>);
          }
          break;
        case "inherited": {
          const def = this.viewstate.elementDetails.appliedStyleRules[0];
          if (def && !def.type) {
            for (const [prop, val] of namvals(def)) {
              list.push(<dt>{prop}</dt>);
              list.push(<dd>{fval(val)}</dd>);
            }
          }
        }
          break;
        case "declared":
          for (const def of this.viewstate.elementDetails.appliedStyleRules) {
            const type = def.type;
            if (!type) continue;
            const {selector, file, properties, lineNo} = def;
            // console.log("def:",selector, file, properties, lineNo);
            if (type == "default-style")
              list.push(<rule>default properties</rule>);
            else {
              const url = new URL(file);
              list.push(<rule .file>
                  <span .selector>{selector}</span>
                  <a .filename href={file} lineno={lineNo}>{url.filename}({lineNo})</a>
                </rule>);
            }
            for (const [prop, val] of namvals(properties)) {
              list.push(<dt>{prop}</dt>);
              list.push(<dd>{fval(val)}</dd>);
            }
          }
          break;
      }
    }
    /*
      {styleRules}
      {metrics}

    */

    return <section.tabs>
      <header>
        <caption>styles:</caption>
        <label #used current={ ctab == "used"}>used</label>
        <label #inherited current={ ctab == "inherited"}>inherited</label>
        <label #declared current={ ctab == "declared"}>declared</label>
      </header>
      <dl #element-details styleset="facade.css#element-details">
        {list}
      </dl>
      <ElementStates #element-states channel={this.channel} />  
      <ElementMetrics #element-metrics channel={this.channel} />  
    </section>
  }

  ["on click at label:not(:current)"](evt, label) {
    this.componentUpdate({currentTab: label.id});
    return false;
  }

  get currentTab() {
    return this.viewstate.detailsTab || "declared";
  }
  set currentTab(v) {
    this.viewstate.detailsTab = v;
  }
}
