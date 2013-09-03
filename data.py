import csv
import datetime
import random

sample_time = datetime.datetime(2011, 8, 3, 9, 30)

with open('src/data/measurements.csv', 'w') as f:
    csv_file = csv.writer(f)

    csv_file.writerow([
        'time',
        'acceleration-x',
        'acceleration-y',
        'temperature',
        'latitude',
        'longitude'
    ])

    for x in xrange(10000):
        csv_file.writerow([
            sample_time,
            random.random(),
            random.random(),
            random.uniform(96.2, 104.9),
            random.uniform(0, 100),
            random.uniform(0, 100),
        ])
        sample_time = sample_time + datetime.timedelta(minutes=1)
