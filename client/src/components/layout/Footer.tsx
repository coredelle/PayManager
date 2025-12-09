export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-serif font-bold text-lg mb-4">PayMyValue</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional diminished value and total loss appraisals for everyday drivers.
              Recover what you're owed.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">Diminished Value</a></li>
              <li><a href="#" className="hover:text-primary">Total Loss</a></li>
              <li><a href="#" className="hover:text-primary">Sample Reports</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">About Us</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
              <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal Disclaimer</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              PayMyValue is not a law firm and does not provide legal advice. 
              Our reports are professional appraisals based on market data.
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} PayMyValue Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
