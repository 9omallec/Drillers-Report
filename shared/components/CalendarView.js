// Calendar View Component
// Displays reports and work days in a calendar format

(function() {
    'use strict';

    const { useState, useMemo } = React;

    window.CalendarView = function CalendarView({ reports, onViewReport, darkMode }) {
        const [currentDate, setCurrentDate] = useState(new Date());

        const monthYear = useMemo(() => {
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            return { month, year };
        }, [currentDate]);

        // Get days in month
        const daysInMonth = useMemo(() => {
            const { month, year } = monthYear;
            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysCount = lastDay.getDate();
            const startDayOfWeek = firstDay.getDay();

            const days = [];

            // Add empty cells for days before month starts
            for (let i = 0; i < startDayOfWeek; i++) {
                days.push({ day: null, reports: [] });
            }

            // Add days of month
            for (let day = 1; day <= daysCount; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                // Find reports with work on this day
                const dayReports = reports.filter(report => {
                    if (!report.workDays) return false;
                    return report.workDays.some(wd => wd.date === dateStr);
                });

                days.push({ day, date: dateStr, reports: dayReports });
            }

            return days;
        }, [monthYear, reports]);

        const navigate = (direction) => {
            setCurrentDate(prev => {
                const newDate = new Date(prev);
                newDate.setMonth(prev.getMonth() + direction);
                return newDate;
            });
        };

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        const bgColor = darkMode ? 'bg-gray-800' : 'bg-white';
        const textColor = darkMode ? 'text-gray-100' : 'text-gray-800';

        return React.createElement('div', {
            className: `rounded-xl p-6 shadow-lg ${bgColor} ${textColor}`
        },
            // Header with navigation
            React.createElement('div', {
                className: 'flex justify-between items-center mb-6'
            },
                React.createElement('button', {
                    onClick: () => navigate(-1),
                    className: `px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
                }, '← Previous'),
                React.createElement('h2', {
                    className: 'text-2xl font-bold'
                }, `📅 ${monthNames[monthYear.month]} ${monthYear.year}`),
                React.createElement('button', {
                    onClick: () => navigate(1),
                    className: `px-4 py-2 rounded-lg font-semibold ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`
                }, 'Next →')
            ),

            // Calendar grid
            React.createElement('div', {
                className: 'grid grid-cols-7 gap-2'
            },
                // Day headers
                ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day =>
                    React.createElement('div', {
                        key: day,
                        className: `text-center font-semibold py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                    }, day)
                ),

                // Calendar days
                daysInMonth.map((dayData, index) =>
                    dayData.day === null ?
                        React.createElement('div', { key: `empty-${index}` }) :
                        React.createElement('div', {
                            key: index,
                            className: `min-h-24 p-2 border rounded-lg ${
                                darkMode ? 'border-gray-700' : 'border-gray-300'
                            } ${
                                dayData.reports.length > 0
                                    ? darkMode ? 'bg-green-900 hover:bg-green-800' : 'bg-green-50 hover:bg-green-100'
                                    : darkMode ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'
                            } cursor-pointer transition-colors`
                        },
                            React.createElement('div', {
                                className: `text-sm font-semibold mb-1 ${
                                    dayData.reports.length > 0 ? 'text-green-600' : 'text-gray-500'
                                }`
                            }, dayData.day),
                            dayData.reports.length > 0 && React.createElement('div', {
                                className: 'text-xs space-y-1'
                            },
                                dayData.reports.slice(0, 2).map(report =>
                                    React.createElement('div', {
                                        key: report.id,
                                        onClick: () => onViewReport(report),
                                        className: `truncate ${darkMode ? 'text-green-300' : 'text-green-700'} hover:underline`
                                    }, report.jobName || report.customer || 'Report')
                                ),
                                dayData.reports.length > 2 && React.createElement('div', {
                                    className: 'text-gray-500'
                                }, `+${dayData.reports.length - 2} more`)
                            )
                        )
                )
            ),

            // Legend
            React.createElement('div', {
                className: 'mt-4 flex gap-4 text-sm'
            },
                React.createElement('div', {
                    className: 'flex items-center gap-2'
                },
                    React.createElement('div', {
                        className: 'w-4 h-4 rounded bg-green-500'
                    }),
                    React.createElement('span', {}, 'Has work')
                ),
                React.createElement('div', {
                    className: 'flex items-center gap-2'
                },
                    React.createElement('div', {
                        className: `w-4 h-4 rounded ${darkMode ? 'bg-gray-900' : 'bg-gray-200'}`
                    }),
                    React.createElement('span', {}, 'No work')
                )
            )
        );
    };

})();
