import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart
} from 'recharts';
import { useStore } from '../hooks/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { MONTHS } from '../constants';
import { differenceInDays, parseISO } from 'date-fns';
import { TrendingUp, Users, Target, Clock, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export function AnalyticsTab() {
  const { quotations, targets } = useStore();

  const data = useMemo(() => {
    // 1. Bar Chart by Product Category
    const categoryMap: Record<string, { name: string; count: number; value: number }> = {};
    quotations.forEach(q => {
      const cat = q.partCategory || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, count: 0, value: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].value += q.basicAmount;
    });
    const categoryData = Object.values(categoryMap).sort((a, b) => b.value - a.value);

    // 2. Bar Chart by Confidence Level
    const confidenceMap: Record<number, { level: string; count: number; value: number }> = {};
    const stages = [10, 20, 50, 75, 90, 100];
    stages.forEach(s => {
      confidenceMap[s] = { level: `${s}%`, count: 0, value: 0 };
    });
    quotations.forEach(q => {
      const stage = q.stagePercent;
      if (confidenceMap[stage]) {
        confidenceMap[stage].count += 1;
        confidenceMap[stage].value += q.basicAmount;
      }
    });
    const confidenceData = Object.values(confidenceMap);

    // 3. Quotation Aging
    const agingBuckets = [
      { name: '0-30 Days', count: 0, value: 0 },
      { name: '31-60 Days', count: 0, value: 0 },
      { name: '61-90 Days', count: 0, value: 0 },
      { name: '90+ Days', count: 0, value: 0 },
    ];
    quotations.forEach(q => {
      if (!q.createdAt) return;
      const days = differenceInDays(new Date(), parseISO(q.createdAt));
      const amount = q.basicAmount || 0;
      if (days <= 30) { agingBuckets[0].count++; agingBuckets[0].value += amount; }
      else if (days <= 60) { agingBuckets[1].count++; agingBuckets[1].value += amount; }
      else if (days <= 90) { agingBuckets[2].count++; agingBuckets[2].value += amount; }
      else { agingBuckets[3].count++; agingBuckets[3].value += amount; }
    });

    // 4. FOS Target vs Achievement (Value)
    const fosPerformanceData = targets.map(t => ({
      name: t.fosName,
      target: t.targetAmount,
      achieved: t.achievedAmount
    }));

    // 5. Month-wise Expected Order
    const monthMap: Record<string, { month: string; count: number; value: number; index: number }> = {};
    MONTHS.forEach((m, i) => {
      monthMap[m] = { month: m.substring(0, 3), count: 0, value: 0, index: i };
    });
    quotations.forEach(q => {
      if (monthMap[q.likelyMonthOfClosure]) {
        monthMap[q.likelyMonthOfClosure].count += 1;
        monthMap[q.likelyMonthOfClosure].value += q.basicAmount;
      }
    });
    const monthlyData = Object.values(monthMap).sort((a, b) => a.index - b.index);

    // 6. Top 20 Customers
    const customerMap: Record<string, { name: string; value: number; count: number }> = {};
    quotations.forEach(q => {
      if (!customerMap[q.customerName]) customerMap[q.customerName] = { name: q.customerName, value: 0, count: 0 };
      customerMap[q.customerName].value += q.basicAmount;
      customerMap[q.customerName].count += 1;
    });
    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    // 7. FOS Follow-up Scorecard (Visits)
    const fosFollowUpData = targets.map(t => ({
      name: t.fosName,
      target: t.targetVisits,
      achieved: t.achievedVisits
    }));

    return {
      categoryData,
      confidenceData,
      agingBuckets,
      fosPerformanceData,
      monthlyData,
      topCustomers,
      fosFollowUpData
    };
  }, [quotations, targets]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Bar Chart by Product Category */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace('₹', '')} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Confidence Level Analysis */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Confidence Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.confidenceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="level" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace('₹', '')} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Pipeline Value']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Aging Buckets */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Quotation Aging
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.agingBuckets}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.agingBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Month-wise Performance */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-purple-500" /> Expected Monthly Order Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace('₹', '')} />
                <YAxis yAxisId="right" orientation="right" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any, name: string) => [name === 'value' ? formatCurrency(value) : value, name === 'value' ? 'Expect Value' : 'Count']}
                />
                <Legend iconType="circle" />
                <Bar yAxisId="left" dataKey="value" name="Expect Value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                <Line yAxisId="right" type="monotone" dataKey="count" name="Quote Count" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. FOS Follow-up Performance */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" /> FOS Follow-up Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fosFollowUpData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Bar dataKey="target" name="Target" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="achieved" name="Achieved" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 6. Top 20 Customers Table */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" /> Top Customers by Quotation Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="font-bold text-[10px]">Rank</TableHead>
                    <TableHead className="font-bold text-[10px]">Customer Name</TableHead>
                    <TableHead className="font-bold text-[10px] text-right">No. of Quotes</TableHead>
                    <TableHead className="font-bold text-[10px] text-right">Total Value</TableHead>
                    <TableHead className="font-bold text-[10px] text-right">Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topCustomers.map((cust, idx) => {
                    const totalBusiness = data.categoryData.reduce((acc, curr) => acc + curr.value, 0);
                    return (
                      <TableRow key={cust.name} className="hover:bg-indigo-50/30 transition-colors">
                        <TableCell className="font-bold text-slate-400">#{idx + 1}</TableCell>
                        <TableCell className="font-bold text-slate-800">{cust.name}</TableCell>
                        <TableCell className="text-right font-medium text-slate-600">{cust.count}</TableCell>
                        <TableCell className="text-right font-bold text-indigo-600">{formatCurrency(cust.value)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[10px] font-bold text-slate-500">{((cust.value / totalBusiness) * 100).toFixed(1)}%</span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500" 
                                style={{ width: `${(cust.value / data.topCustomers[0].value) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 7. FOS Sales Target vs Achievement */}
        <Card className="border-none shadow-lg shadow-slate-200/40 bg-white/80 backdrop-blur-xl md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> FOS Sales Performance (Target vs Achievement)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fosPerformanceData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={11} tick={{fill: '#64748b'}} />
                <YAxis fontSize={10} tick={{fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v).replace('₹', '')} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="target" name="Target Value" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar dataKey="achieved" name="Achieved Value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
