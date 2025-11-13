/**
 * Analytics Components
 * Charts and statistics for report data visualization
 */

(function() {
    'use strict';

    const { useState, useMemo } = React;

    /**
     * Simple Bar Chart Component
     */
    function BarChart({ data, title, darkMode }) {
        if (!data || data.length === 0) return null;

        const maxValue = Math.max(...data.map(d => d.value));

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
                { className: 'space-y-3' },
                data.map((item, index) =>
                    React.createElement(
                        'div',
                        { key: index },
                        React.createElement(
                            'div',
                            { className: 'flex justify-between items-center mb-1' },
                            React.createElement(
                                'span',
                                { className: `text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}` },
                                item.label
                            ),
                            React.createElement(
                                'span',
                                { className: `text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}` },
                                item.value.toLocaleString()
                            )
                        ),
                        React.createElement(
                            'div',
                            { className: `h-8 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden` },
                            React.createElement('div', {
                                className: 'h-full bg-green-600 rounded-full transition-all duration-500',
                                style: { width: `${(item.value / maxValue) * 100}%` }
                            })
                        )
                    )
                )
            )
        );
    }

    /**
     * Stat Card Component
     */
    function StatCard({ label, value, icon, darkMode, trend }) {
        return React.createElement(
            'div',
            { className: `${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm` },
            React.createElement(
                'div',
                { className: 'flex justify-between items-start' },
                React.createElement(
                    'div',
                    null,
                    React.createElement(
                        'p',
                        { className: `text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}` },
                        label
                    ),
                    React.createElement(
                        'p',
                        { className: `text-2xl font-bold mt-1 ${darkMode ? 'text-gray-100' : 'text-gray-900'}` },
                        value
                    ),
                    trend && React.createElement(
                        'p',
                        { className: `text-xs mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}` },
                        trend > 0 ? '↑' : '↓',
                        ' ',
                        Math.abs(trend),
                        '% vs last period'
                    )
                ),
                icon && React.createElement(
                    'div',
                    { className: `text-3xl ${darkMode ? 'text-gray-600' : 'text-gray-300'}` },
                    icon
                )
            )
        );
    }

    /**
     * Analytics Dashboard Component
     */
    function AnalyticsDashboard({ reports, darkMode }) {
        const [timeRange, setTimeRange] = useState('30'); // days

        const analytics = useMemo(() => {
            if (!reports || reports.length === 0) return null;

            const now = new Date();
            const cutoffDate = new Date(now.getTime() - parseInt(timeRange) * 24 * 60 * 60 * 1000);

            // Filter reports by time range
            const filteredReports = reports.filter(report => {
                const reportDate = new Date(report.importedAt || report.date);
                return reportDate >= cutoffDate;
            });

            // Total footage
            const totalFootage = filteredReports.reduce((sum, report) => {
                return sum + (report.borings?.reduce((s, b) => s + (parseFloat(b.footage) || 0), 0) || 0);
            }, 0);

            // Total hours
            const totalHours = filteredReports.reduce((sum, report) => {
                return sum + (report.workDays?.reduce((s, day) => s + (parseFloat(day.hoursOnSite) || 0), 0) || 0);
            }, 0);

            // Reports by client
            const clientStats = {};
            filteredReports.forEach(report => {
                const client = report.client || report.customer || 'Unknown';
                if (!clientStats[client]) {
                    clientStats[client] = { count: 0, footage: 0 };
                }
                clientStats[client].count++;
                clientStats[client].footage += report.borings?.reduce((s, b) => s + (parseFloat(b.footage) || 0), 0) || 0;
            });

            const topClients = Object.entries(clientStats)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([label, data]) => ({
                    label,
                    value: data.count,
                    footage: data.footage
                }));

            // Footage by method
            const methodStats = {};
            filteredReports.forEach(report => {
                report.borings?.forEach(boring => {
                    const method = boring.method || 'Unknown';
                    const footage = parseFloat(boring.footage) || 0;
                    if (footage > 0) {
                        methodStats[method] = (methodStats[method] || 0) + footage;
                    }
                });
            });

            const footageByMethod = Object.entries(methodStats)
                .sort((a, b) => b[1] - a[1])
                .map(([label, value]) => ({ label, value }));

            // Reports by driller
            const drillerStats = {};
            filteredReports.forEach(report => {
                const driller = report.driller || 'Unknown';
                drillerStats[driller] = (drillerStats[driller] || 0) + 1;
            });

            const reportsByDriller = Object.entries(drillerStats)
                .sort((a, b) => b[1] - a[1])
                .map(([label, value]) => ({ label, value }));

            return {
                totalReports: filteredReports.length,
                totalFootage: totalFootage.toFixed(1),
                totalHours: totalHours.toFixed(1),
                avgFootagePerReport: filteredReports.length > 0 ? (totalFootage / filteredReports.length).toFixed(1) : '0',
                topClients,
                footageByMethod,
                reportsByDriller
            };
        }, [reports, timeRange]);

        if (!analytics || analytics.totalReports === 0) {
            return React.createElement(
                'div',
                { className: `${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'} rounded-lg p-6 text-center` },
                'No reports available for the selected time range'
            );
        }

        return React.createElement(
            'div',
            { className: 'space-y-6' },
            // Time Range Selector
            React.createElement(
                'div',
                { className: 'flex gap-2 justify-end' },
                ['7', '30', '90', '365'].map(days =>
                    React.createElement(
                        'button',
                        {
                            key: days,
                            onClick: () => setTimeRange(days),
                            className: `px-3 py-1 rounded text-sm ${
                                timeRange === days
                                    ? 'bg-green-600 text-white'
                                    : darkMode
                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } transition-colors`
                        },
                        days === '365' ? '1 Year' : `${days} Days`
                    )
                )
            ),
            // Summary Stats
            React.createElement(
                'div',
                { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
                React.createElement(StatCard, {
                    label: 'Total Reports',
                    value: analytics.totalReports,
                    icon: '📋',
                    darkMode
                }),
                React.createElement(StatCard, {
                    label: 'Total Footage',
                    value: `${analytics.totalFootage} ft`,
                    icon: '📏',
                    darkMode
                }),
                React.createElement(StatCard, {
                    label: 'Total Hours',
                    value: `${analytics.totalHours} hrs`,
                    icon: '⏱️',
                    darkMode
                }),
                React.createElement(StatCard, {
                    label: 'Avg Footage/Report',
                    value: `${analytics.avgFootagePerReport} ft`,
                    icon: '📊',
                    darkMode
                })
            ),
            // Charts
            React.createElement(
                'div',
                { className: 'grid grid-cols-1 lg:grid-cols-2 gap-6' },
                analytics.topClients.length > 0 && React.createElement(BarChart, {
                    data: analytics.topClients,
                    title: 'Reports by Client',
                    darkMode
                }),
                analytics.footageByMethod.length > 0 && React.createElement(BarChart, {
                    data: analytics.footageByMethod,
                    title: 'Footage by Method',
                    darkMode
                }),
                analytics.reportsByDriller.length > 0 && React.createElement(BarChart, {
                    data: analytics.reportsByDriller,
                    title: 'Reports by Driller',
                    darkMode
                })
            )
        );
    }

    // Export components
    window.AnalyticsComponents = {
        BarChart,
        StatCard,
        AnalyticsDashboard
    };

    console.log('✓ Analytics components initialized');

})();
