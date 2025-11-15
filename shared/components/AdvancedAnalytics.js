/**
 * Advanced Analytics Components
 * Enhanced analytics with trends, revenue projections, and profitability analysis
 */

(function() {
    'use strict';

    const { useState, useMemo } = React;

    /**
     * Line Chart Component for Trends
     */
    function LineChart({ data, title, darkMode, yAxisLabel }) {
        if (!data || data.length === 0) return null;

        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const range = maxValue - minValue || 1;

        // Calculate points for the line
        const points = data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (((item.value - minValue) / range) * 100);
            return `${x},${y}`;
        }).join(' ');

        return React.createElement(
            'div',
            { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm` },
            React.createElement(
                'h3',
                { className: `text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}` },
                title
            ),
            React.createElement(
                'div',
                { className: 'relative' },
                // SVG Chart
                React.createElement(
                    'svg',
                    {
                        viewBox: '0 0 100 100',
                        className: 'w-full h-48',
                        preserveAspectRatio: 'none'
                    },
                    // Grid lines
                    [0, 25, 50, 75, 100].map(y =>
                        React.createElement('line', {
                            key: y,
                            x1: '0',
                            y1: y.toString(),
                            x2: '100',
                            y2: y.toString(),
                            stroke: darkMode ? '#374151' : '#E5E7EB',
                            strokeWidth: '0.2'
                        })
                    ),
                    // Line
                    React.createElement('polyline', {
                        points,
                        fill: 'none',
                        stroke: '#10B981',
                        strokeWidth: '2',
                        strokeLinecap: 'round',
                        strokeLinejoin: 'round'
                    }),
                    // Points
                    data.map((item, index) => {
                        const x = (index / (data.length - 1)) * 100;
                        const y = 100 - (((item.value - minValue) / range) * 100);
                        return React.createElement('circle', {
                            key: index,
                            cx: x.toString(),
                            cy: y.toString(),
                            r: '1.5',
                            fill: '#10B981'
                        });
                    })
                ),
                // X-axis labels
                React.createElement(
                    'div',
                    { className: 'flex justify-between mt-2' },
                    data.map((item, index) =>
                        index % Math.ceil(data.length / 6) === 0 || index === data.length - 1 ?
                        React.createElement(
                            'span',
                            {
                                key: index,
                                className: `text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                            },
                            item.label
                        ) : React.createElement('span', { key: index })
                    )
                ),
                // Value display
                React.createElement(
                    'div',
                    { className: 'flex justify-between mt-2 text-sm' },
                    React.createElement('span', { className: darkMode ? 'text-gray-400' : 'text-gray-600' },
                        `Min: ${minValue.toFixed(1)} ${yAxisLabel || ''}`),
                    React.createElement('span', { className: darkMode ? 'text-gray-400' : 'text-gray-600' },
                        `Max: ${maxValue.toFixed(1)} ${yAxisLabel || ''}`)
                )
            )
        );
    }

    /**
     * Advanced Analytics Dashboard
     */
    function AdvancedAnalyticsDashboard({ reports, darkMode }) {
        const now = new Date();

        const clientService = useMemo(() => {
            return new window.ClientService(new window.StorageService());
        }, []);

        const clients = useMemo(() => {
            return clientService.getAllClients();
        }, [clientService]);

        const analytics = useMemo(() => {
            // Month-over-month trends (last 12 months)
            const monthlyData = {};
            const last12Months = [];

            for (let i = 11; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

                last12Months.push({ key, label });
                monthlyData[key] = { footage: 0, hours: 0, reports: 0, revenue: 0 };
            }

            reports.forEach(report => {
                const reportDate = new Date(report.date || report.importedAt);
                const key = `${reportDate.getFullYear()}-${String(reportDate.getMonth() + 1).padStart(2, '0')}`;

                if (monthlyData[key]) {
                    const footage = report.borings?.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0) || 0;
                    const hours = report.workDays?.reduce((sum, day) => {
                        const drive = parseFloat(day.hoursDriving) || 0;
                        const onSite = parseFloat(day.hoursOnSite) || 0;
                        return sum + drive + onSite;
                    }, 0) || 0;

                    monthlyData[key].footage += footage;
                    monthlyData[key].hours += hours;
                    monthlyData[key].reports += 1;

                    // Calculate revenue
                    const clientName = report.client || report.customer;
                    const client = clients.find(c => c.name === clientName);
                    if (client && client.billingRate) {
                        if (client.rateType === 'per_foot') {
                            monthlyData[key].revenue += footage * client.billingRate;
                        } else if (client.rateType === 'per_hour') {
                            monthlyData[key].revenue += hours * client.billingRate;
                        }
                    }
                }
            });

            const footageTrend = last12Months.map(m => ({
                label: m.label,
                value: monthlyData[m.key].footage
            }));

            const hoursTrend = last12Months.map(m => ({
                label: m.label,
                value: monthlyData[m.key].hours
            }));

            const revenueTrend = last12Months.map(m => ({
                label: m.label,
                value: monthlyData[m.key].revenue
            }));

            // Client profitability (clients with billing rates)
            const clientProfitability = [];
            clients.forEach(client => {
                if (client.billingRate > 0) {
                    const clientReports = reports.filter(r =>
                        (r.client || r.customer) === client.name
                    );

                    let revenue = 0;
                    clientReports.forEach(report => {
                        const footage = report.borings?.reduce((sum, b) => sum + (parseFloat(b.footage) || 0), 0) || 0;
                        const hours = report.workDays?.reduce((sum, day) => {
                            const drive = parseFloat(day.hoursDriving) || 0;
                            const onSite = parseFloat(day.hoursOnSite) || 0;
                            return sum + drive + onSite;
                        }, 0) || 0;

                        if (client.rateType === 'per_foot') {
                            revenue += footage * client.billingRate;
                        } else if (client.rateType === 'per_hour') {
                            revenue += hours * client.billingRate;
                        }
                    });

                    if (revenue > 0) {
                        clientProfitability.push({
                            label: client.name,
                            value: revenue,
                            reports: clientReports.length
                        });
                    }
                }
            });

            clientProfitability.sort((a, b) => b.value - a.value);

            // Busiest months analysis
            const monthlyActivity = {};
            reports.forEach(report => {
                const reportDate = new Date(report.date || report.importedAt);
                const monthName = reportDate.toLocaleDateString('en-US', { month: 'long' });

                if (!monthlyActivity[monthName]) {
                    monthlyActivity[monthName] = 0;
                }
                monthlyActivity[monthName] += 1;
            });

            const busiestMonths = Object.entries(monthlyActivity)
                .map(([label, value]) => ({ label, value }))
                .sort((a, b) => b.value - a.value);

            // Year-over-year comparison
            const currentYear = now.getFullYear();
            const lastYear = currentYear - 1;

            const currentYearReports = reports.filter(r => {
                const year = new Date(r.date || r.importedAt).getFullYear();
                return year === currentYear;
            });

            const lastYearReports = reports.filter(r => {
                const year = new Date(r.date || r.importedAt).getFullYear();
                return year === lastYear;
            });

            const currentYearFootage = currentYearReports.reduce((sum, r) =>
                sum + (r.borings?.reduce((s, b) => s + (parseFloat(b.footage) || 0), 0) || 0), 0);

            const lastYearFootage = lastYearReports.reduce((sum, r) =>
                sum + (r.borings?.reduce((s, b) => s + (parseFloat(b.footage) || 0), 0) || 0), 0);

            const footageChange = lastYearFootage > 0 ?
                ((currentYearFootage - lastYearFootage) / lastYearFootage * 100) : 0;

            return {
                footageTrend,
                hoursTrend,
                revenueTrend,
                clientProfitability: clientProfitability.slice(0, 10),
                busiestMonths: busiestMonths.slice(0, 12),
                yearOverYear: {
                    currentYear,
                    lastYear,
                    currentYearReports: currentYearReports.length,
                    lastYearReports: lastYearReports.length,
                    currentYearFootage,
                    lastYearFootage,
                    footageChange
                }
            };
        }, [reports, clients]);

        if (!reports || reports.length === 0) {
            return React.createElement(
                'div',
                { className: `${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600'} rounded-lg p-8 text-center` },
                React.createElement('p', {}, 'No reports available for advanced analytics')
            );
        }

        return React.createElement(
            'div',
            { className: 'space-y-6' },

            // Year-over-Year Comparison
            React.createElement('div', { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-6 shadow-sm` },
                React.createElement('h3', {
                    className: `text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`
                }, 'Year-over-Year Comparison'),
                React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
                    React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` },
                            analytics.yearOverYear.currentYearReports),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` },
                            `${analytics.yearOverYear.currentYear} Reports`)
                    ),
                    React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` },
                            analytics.yearOverYear.lastYearReports),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` },
                            `${analytics.yearOverYear.lastYear} Reports`)
                    ),
                    React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                        React.createElement('div', { className: `text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}` },
                            `${analytics.yearOverYear.currentYearFootage.toFixed(0)} ft`),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` },
                            `${analytics.yearOverYear.currentYear} Footage`)
                    ),
                    React.createElement('div', { className: `p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}` },
                        React.createElement('div', {
                            className: `text-2xl font-bold ${analytics.yearOverYear.footageChange >= 0 ? 'text-green-600' : 'text-red-600'}`
                        }, `${analytics.yearOverYear.footageChange > 0 ? '+' : ''}${analytics.yearOverYear.footageChange.toFixed(1)}%`),
                        React.createElement('div', { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` },
                            'YoY Change')
                    )
                )
            ),

            // Trends Charts
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                React.createElement(LineChart, {
                    data: analytics.footageTrend,
                    title: 'Footage Trend (12 Months)',
                    darkMode,
                    yAxisLabel: 'ft'
                }),
                React.createElement(LineChart, {
                    data: analytics.hoursTrend,
                    title: 'Hours Trend (12 Months)',
                    darkMode,
                    yAxisLabel: 'hrs'
                })
            ),

            // Revenue Projection
            analytics.revenueTrend.some(d => d.value > 0) && React.createElement(LineChart, {
                data: analytics.revenueTrend,
                title: 'Revenue Projection (12 Months)',
                darkMode,
                yAxisLabel: '$'
            }),

            // Client Profitability & Busiest Months
            React.createElement('div', { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                analytics.clientProfitability.length > 0 && React.createElement(
                    'div',
                    { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm` },
                    React.createElement('h3', {
                        className: `text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`
                    }, 'Client Profitability (Top 10)'),
                    React.createElement('div', { className: 'space-y-3' },
                        analytics.clientProfitability.map((item, index) => {
                            const maxValue = analytics.clientProfitability[0].value;
                            return React.createElement('div', { key: index },
                                React.createElement('div', { className: 'flex justify-between items-center mb-1' },
                                    React.createElement('span', {
                                        className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                                    }, item.label),
                                    React.createElement('span', {
                                        className: `text-sm font-semibold text-green-600`
                                    }, `$${item.value.toFixed(2)}`)
                                ),
                                React.createElement('div', {
                                    className: `h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`
                                },
                                    React.createElement('div', {
                                        className: 'h-full bg-green-600 rounded-full transition-all duration-500',
                                        style: { width: `${(item.value / maxValue) * 100}%` }
                                    })
                                )
                            );
                        })
                    )
                ),

                React.createElement(
                    'div',
                    { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm` },
                    React.createElement('h3', {
                        className: `text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`
                    }, 'Busiest Months (All Time)'),
                    React.createElement('div', { className: 'space-y-3' },
                        analytics.busiestMonths.map((item, index) => {
                            const maxValue = analytics.busiestMonths[0].value;
                            return React.createElement('div', { key: index },
                                React.createElement('div', { className: 'flex justify-between items-center mb-1' },
                                    React.createElement('span', {
                                        className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`
                                    }, item.label),
                                    React.createElement('span', {
                                        className: `text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`
                                    }, `${item.value} reports`)
                                ),
                                React.createElement('div', {
                                    className: `h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`
                                },
                                    React.createElement('div', {
                                        className: 'h-full bg-blue-600 rounded-full transition-all duration-500',
                                        style: { width: `${(item.value / maxValue) * 100}%` }
                                    })
                                )
                            );
                        })
                    )
                )
            )
        );
    }

    // Export components
    window.AdvancedAnalyticsComponents = {
        AdvancedAnalyticsDashboard,
        LineChart
    };

})();
