import pandas as pd
from datetime import timedelta
data = pd.DataFrame(pd.read_json("https://interactive.guim.co.uk/docsdata/1q5gdePANXci8enuiS4oHUJxcxC13d6bjMRSicakychE.json", convert_dates=False).sheets.updates)
data = data[data.columns[:11]]
del data["Time"], data["Intensive care (count)"], data["Hospitalisations (count)"], data["Ventilator usage (count)"]
data.columns = ["state", "date", "cases", "deaths", "tests_negative", "tests_total", "recovered"]
data["date"] = pd.to_datetime(data.loc[:, "date"], format="%d/%m/%Y")
states = data["state"].unique()
state = 0
while state < len(states):
    state_data = data[data["state"] == states[state]]
    date_range = [state_data["date"].min()]
    while date_range[-1] < state_data["date"].max():
        date_range.append(date_range[-1] + timedelta(days=1))
    new_state_data = pd.DataFrame(index=date_range)
    for column in data.columns[2:]:
        new_state_data[column] = [0] * len(new_state_data)
        for index, row in state_data.iterrows():
            if row[column].isnumeric():
                new_state_data.loc[row["date"]][column] = row[column]
        floor = 0
        for index, row in new_state_data.iterrows():
            if row[column] < floor:
                row[column] = floor
            else:
                floor = row[column]
    new_state_data.to_csv("./resources/data/" + states[state] + "_data.csv")
    state = state + 1
