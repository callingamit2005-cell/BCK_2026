import { useState } from 'react';
import { smartParseSMS, ParsedData } from '@/utils/transactionParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SMSTester = () => {
  const [testMessage, setTestMessage] = useState('');
  const [result, setResult] = useState<ParsedData | null>(null);

  const handleTest = () => {
    const data = smartParseSMS(testMessage);
    setResult(data);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-indigo-200 shadow-xl">
        <CardHeader className="bg-indigo-600 text-white rounded-t-xl">
          <CardTitle>SMS Parser Sandbox (Beta Testing)</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <textarea 
            className="w-full p-4 border-2 rounded-xl h-32 focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="Bank SMS yahan paste karein (SBI, HDFC, ICICI etc.)..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
          />
          <Button onClick={handleTest} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-bold rounded-xl">
            Test Regex Logic ✨
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4 space-y-2">
            <h3 className="font-bold text-emerald-800 border-b pb-2">Extracted Output:</h3>
            <p><strong>Amount:</strong> ₹{result.amount || 'Not Found'}</p>
            <p><strong>Merchant/To:</strong> {result.note || 'Not Found'}</p>
            <p><strong>Mode:</strong> {result.paymentMode}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SMSTester;