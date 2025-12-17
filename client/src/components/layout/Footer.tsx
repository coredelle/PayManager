import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-16 mt-auto text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="font-serif font-bold text-xl mb-4">PayMyValue</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              IACP certified diminished value and total loss appraisals for everyday drivers. Recover the full amount you are owed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">Product</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-diminished-value">Diminished Value</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-total-loss">Total Loss</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-sample-reports">Sample Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">Company</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-about">About Us</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-contact">Contact</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-terms">Terms of Service</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-privacy">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors" data-testid="link-legal">Legal Disclaimer</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-200">Legal Disclaimer</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              PayMyValue is not a law firm and does not provide legal advice. Our reports are IACP certified appraisals based on market data and accepted industry standards.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PayMyValue Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
