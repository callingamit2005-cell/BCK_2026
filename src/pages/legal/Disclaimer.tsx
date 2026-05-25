import LegalLayout from "@/components/layout/LegalLayout";

const Disclaimer = () => (
  <LegalLayout title="Disclaimer">
    <p>Last Updated: March 2026</p>
    
    <h2>1. Not Financial Advice</h2>
    <p>The information provided by BachatKaro (a project of ORV Tech) is for general informational purposes only. All information on the site is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy or completeness of any data entered by the user.</p>
    
    <h2>2. User Responsibility</h2>
    <p>Your use of the service and your reliance on any information on the service is solely at your own risk. This includes salary budgeting, expense tracking, and EMI calculations provided in the dashboard.</p>

    <h2>3. External Links (AdSense)</h2>
    <p>BachatKaro may contain links to third-party websites or content, including advertisements served by Google AdSense. Such external links are not investigated, monitored, or checked for accuracy by us.</p>
    
    <p className="mt-10 italic border-l-4 border-purple-200 pl-4">
      "Bachat Karo, Sapne Pure karo" is a motivational slogan and should not be construed as a guarantee of financial success.
    </p>
  </LegalLayout>
);

export default Disclaimer;