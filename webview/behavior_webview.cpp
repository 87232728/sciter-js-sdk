#include "sciter-x.h"
#include "sciter-x-behavior.h"
#include "webview/sciter_webview.h"

namespace sciter
{
	/*
	BEHAVIOR: webview
	   - provides web pages
	COMMENTS:
	   <webview style="behavior:webview" />
	SAMPLE:
	   See: samples/webview/webview.htm
	*/

	struct sciter_webview : public event_handler
	{
		webview::webview *this_webview;
		HELEMENT this_element;
		bool first_load;

		// ctor
		sciter_webview() : this_webview(nullptr), this_element(0) {}
		virtual ~sciter_webview() {}

		virtual bool subscription(HELEMENT he, UINT &event_groups) override
		{
			event_groups = HANDLE_BEHAVIOR_EVENT | HANDLE_SIZE;
			return true;
		}

		virtual void attached(HELEMENT he) override
		{
			first_load = true;
			this_element = he;

			dom::element self = dom::element(this_element);
			HWINDOW parent = self.get_element_hwnd(false);
			this_webview = new webview::webview(true, parent);
			HWINDOW window = (HWINDOW)this_webview->window();
			self.attach_hwnd(window);

			this_webview->set_navigation_callback([&](const char *evt, const std::string &param) -> int
												  {
				sciter::value strEvt = sciter::value::make_string(aux::utf2w(evt));
				sciter::value strParam = sciter::value::make_string(aux::utf2w(param));
				dom::element self = dom::element(this_element);
				sciter::value ret = self.call_method("onNavigation", strEvt, strParam);
				return ret.get(0); });
			bindSciterJSCall();
		}

		virtual void detached(HELEMENT he) override
		{
			if (nullptr != this_webview)
			{
				delete this_webview;
				this_webview = nullptr;
			}
			asset_release();
		}

		virtual void handle_size(HELEMENT he) override
		{
			if (nullptr == this_webview)
			{
				return;
			}
			dom::element self = dom::element(he);
			RECT rc = self.get_location(CONTENT_BOX);
			this_webview->set_size(rc.right - rc.left, rc.bottom - rc.top, WEBVIEW_HINT_FIXED);

			if (first_load)
			{
				first_load = false;
				sciter::string src = self.get_attribute("src");
				if (src.size() > 0)
				{
					sciter::astring utfSrc(aux::w2utf(src.c_str()));
					this_webview->navigate(utfSrc.c_str());
				}
			}
		}

		void bindSciterJSCall()
		{
			if (nullptr == this_webview)
			{
				return;
			}
			this_webview->bind(
				"jsBridgeCall", [](std::string seq, std::string req, void *arg) -> void
				{
				sciter_webview* elem_webview = (sciter_webview*)arg;
				if (nullptr == elem_webview) {
					return;
				}
				sciter::value jsonCall = sciter::value::from_string(aux::utf2w(req), CVT_JSON_LITERAL);
				dom::element self = dom::element(elem_webview->this_element);
				sciter::string ret = self.call_method("jsBridgeCall", jsonCall).to_string();
				sciter::astring utfRet(aux::w2utf(ret.c_str()));
				elem_webview->this_webview->resolve(seq, 0, utfRet.c_str()); },
				this);
		}

		void unbindSciterJSCall()
		{
			if (nullptr == this_webview)
			{
				return;
			}
			this_webview->unbind("jsBridgeCall");
		}

		void loadUrl(const sciter::value &url)
		{
			if (nullptr == this_webview)
			{
				return;
			}
			sciter::string strUrl = url.to_string();
			sciter::astring utfUrl(aux::w2utf(strUrl.c_str()));
			this_webview->navigate(utfUrl.c_str());
		}

		void loadHtml(const sciter::value &html)
		{
			if (nullptr == this_webview)
			{
				return;
			}
			sciter::string strHtml = html.to_string();
			sciter::astring utfHtml(aux::w2utf(strHtml.c_str()));
			this_webview->set_html(utfHtml.c_str());
		}

		void evaluateJavaScript(const sciter::value &jsStr)
		{
			if (nullptr == this_webview)
			{
				return;
			}
			sciter::string strJS = jsStr.to_string();
			sciter::astring utfJS(aux::w2utf(strJS.c_str()));
			this_webview->eval(utfJS.c_str());
		}

		void reload()
		{
			if (nullptr == this_webview)
			{
				return;
			}
			this_webview->reload();
		}

		void goBack()
		{
			if (nullptr == this_webview)
			{
				return;
			}
			this_webview->go_back();
		}

		void goForward()
		{
			if (nullptr == this_webview)
			{
				return;
			}
			this_webview->go_forward();
		}

		void stop()
		{
			if (nullptr == this_webview)
			{
				return;
			}
		}

		SOM_PASSPORT_BEGIN_EX(webview, sciter_webview)
		SOM_FUNCS(
			SOM_FUNC(loadUrl),
			SOM_FUNC(loadHtml),
			SOM_FUNC(reload),
			SOM_FUNC(goBack),
			SOM_FUNC(goForward),
			SOM_FUNC(stop),
			SOM_FUNC(evaluateJavaScript))
		SOM_PASSPORT_END
	};

}

#ifdef SCITERWEBVIEW_EXPORTS

/** The SciterBehaviorFactory of this module */
SBOOL SCAPI ThisBehaviorFactory(LPCSTR name, HELEMENT he, LPElementEventProc *elProc, LPVOID *elTag)
{

	if (aux::chars_of(name) != const_chars("webview"))
	{
		return FALSE;
	}
	sciter::sciter_webview *webview = new sciter::sciter_webview();
	webview->asset_add_ref();
	*elProc = webview->element_proc;
	*elTag = webview;
	return TRUE;
}

extern "C"
{
	/** SciterBehaviorFactoryInit is the only exported function that Sciter runtime will call to initialize Sciter component extension library.
	 * \param psapi[in] \b ISciterAPI*, instance of Sciter API interface provided by Sciter runtime to the library.
	 * \param pfactory[out] \b SciterBehaviorFactory**, instance of behavior factory that will create behaviors of this library.
	 * \return TRUE on success.
	 **/
#ifndef WINDOWS
	__attribute__((visibility("default")))
#endif
	SBOOL SCAPI SciterBehaviorFactoryInit(ISciterAPI *psapi, SciterBehaviorFactory **pfactory)
	{
		_SAPI(psapi); // set reference to Sciter API provided by host application including scapp(quark)
		*pfactory = ThisBehaviorFactory;
		return TRUE;
	}
}

#else

namespace sciter
{
    struct webview_factory : public behavior_factory
    {

        webview_factory() : behavior_factory("webview") {}

        // the only behavior_factory method:
        virtual event_handler *create(HELEMENT he)
        {
            return new sciter_webview();
        }
    };

    // instantiating and attaching it to the global list
    webview_factory webview_factory_instance;
}

#endif