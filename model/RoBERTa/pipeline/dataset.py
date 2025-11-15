import json
import pandas as pd
from datasets import Dataset, DatasetDict
from sklearn.model_selection import train_test_split


def read_json(file_name):
    with open(file_name, 'r') as file:
        return [json.loads(line) for line in file]

def json_dataset_parser(jsons_list, labels_dict):
    """Parse a list of JSON objects into a pandas DataFrame.

    Robust to missing keys. Records missing required fields (text or label)
    or with unknown labels are skipped with a warning. 'domain' is
    optional and will be set to None when absent.

    Returns a DataFrame with columns: text, labels, domain
    """
    data_dict = {"text": [], "labels": [], "domain": []}
    skipped = 0
    for i, obj in enumerate(jsons_list):
        # Validate required fields
        if not isinstance(obj, dict):
            skipped += 1
            continue

        text = obj.get("text")
        label = obj.get("label")
        if text is None or label is None:
            skipped += 1
            continue

        # map label to integer if present in labels_dict
        if label not in labels_dict:
            skipped += 1
            continue

        data_dict["text"].append(text)
        data_dict["labels"].append(labels_dict[label])
        # domain is optional
        data_dict["domain"].append(obj.get("domain", None))

    if skipped:
        print(f"json_dataset_parser: skipped {skipped} malformed or unknown-label records")

    if len(data_dict["text"]) == 0:
        raise ValueError("No valid records found after parsing JSONs. Check input file and labels mapping.")

    # Ensure all lists are same length (sanity check)
    lengths = {k: len(v) for k, v in data_dict.items()}
    if len(set(lengths.values())) != 1:
        raise ValueError(f"Inconsistent parsed column lengths: {lengths}")

    return pd.DataFrame(data_dict)

def prepare_dataset(file_path, labels_dict, test_size=0.15, val_size=0.15, sample_frac=1.0):
    jsons_list = read_json(file_path)
    df = json_dataset_parser(jsons_list, labels_dict)
    df = df.sample(frac=sample_frac).reset_index(drop=True)

    train_val, test = train_test_split(df, test_size=test_size, stratify=df['labels'])
    train, val = train_test_split(train_val, test_size=val_size/(1-test_size), stratify=train_val['labels'])

    dataset = DatasetDict({
        'train': Dataset.from_pandas(train),
        'val': Dataset.from_pandas(val),
        'test': Dataset.from_pandas(test)
    })
    return dataset


def save_tokenized_dataset(tokenized_datasets, save_path):
    tokenized_datasets.save_to_disk(save_path)

def load_tokenized_dataset(load_path):
    return DatasetDict.load_from_disk(load_path)