from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

# Constants
M_VALUES = {
    "Classic": 100,
    "Medium": 120,
    "Artisanal": 150
}

S_VALUES = {
    "Before Cooking": 1.0,
    "During Cooking": 0.8,
    "After Cooking": 0.4
}


def calculate_utility(T, t, N, arrosticini_type, salting_timing):
    """
    Legacy illustrative utility function (parameters are not estimated from data):
    U(T, t, N, S, M) = S * max(0, M - 0.1*(T-200)^2 - 2*(t-8)^2 - 15*(N-1)^2)
    """
    M = M_VALUES.get(arrosticini_type, 100)
    S = S_VALUES.get(salting_timing, 1.0)

    inner = M - 0.1 * (T - 200) ** 2 - 2 * (t - 8) ** 2 - 15 * (N - 1) ** 2
    utility = S * max(0, inner)
    return round(utility, 4)


def generate_curve_data(param, param_range, fixed_params):
    """Generate utility values over a range for charting."""
    values = []
    labels = []
    T = fixed_params['T']
    t = fixed_params['t']
    N = fixed_params['N']
    arrosticini_type = fixed_params['type']
    salting_timing = fixed_params['salting']

    for val in param_range:
        if param == 'T':
            u = calculate_utility(val, t, N, arrosticini_type, salting_timing)
        elif param == 't':
            u = calculate_utility(T, val, N, arrosticini_type, salting_timing)
        elif param == 'N':
            u = calculate_utility(T, t, val, arrosticini_type, salting_timing)
        else:
            u = 0
        values.append(u)
        labels.append(val)

    return labels, values


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/laboratorio')
def laboratorio():
    """Keep the original playful experiment separate from the shopping planner."""
    return render_template('laboratorio.html')


def validate_legacy_input(data):
    """Validate the public API, including calls made outside the slider UI."""
    if not isinstance(data, dict):
        raise ValueError('Il corpo della richiesta deve essere un oggetto JSON.')

    def number(field, default, lower, upper, integer=False):
        value = data.get(field, default)
        if isinstance(value, bool) or not isinstance(value, (int, float, str)):
            raise ValueError(f'{field}: inserire un numero valido.')
        try:
            result = float(value)
        except (TypeError, ValueError, OverflowError):
            raise ValueError(f'{field}: inserire un numero valido.') from None
        if not math.isfinite(result) or not lower <= result <= upper:
            raise ValueError(f'{field}: il valore deve essere tra {lower} e {upper}.')
        if integer and not result.is_integer():
            raise ValueError(f'{field}: il valore deve essere intero.')
        return int(result) if integer else result

    temperature = number('temperature', 200, 100, 300)
    duration = number('time', 8, 1, 20)
    turns = number('turns', 1, 1, 10, integer=True)
    product = data.get('type', 'Classic')
    salting = data.get('salting', 'Before Cooking')
    if not isinstance(product, str) or product not in M_VALUES:
        raise ValueError('type: tipologia non riconosciuta.')
    if not isinstance(salting, str) or salting not in S_VALUES:
        raise ValueError('salting: opzione non riconosciuta.')
    return temperature, duration, turns, product, salting


@app.route('/api/calculate', methods=['POST'])
def calculate():
    try:
        T, t, N, arrosticini_type, salting_timing = validate_legacy_input(
            request.get_json(silent=True)
        )
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    utility = calculate_utility(T, t, N, arrosticini_type, salting_timing)

    # Generate curve data for each parameter
    T_labels, T_values = generate_curve_data(
        'T',
        [i for i in range(100, 301, 5)],
        {'T': T, 't': t, 'N': N, 'type': arrosticini_type, 'salting': salting_timing}
    )
    t_labels, t_values = generate_curve_data(
        't',
        [round(i * 0.5, 1) for i in range(2, 41)],
        {'T': T, 't': t, 'N': N, 'type': arrosticini_type, 'salting': salting_timing}
    )
    N_labels, N_values = generate_curve_data(
        'N',
        list(range(1, 11)),
        {'T': T, 't': t, 'N': N, 'type': arrosticini_type, 'salting': salting_timing}
    )

    M = M_VALUES.get(arrosticini_type, 100)
    S = S_VALUES.get(salting_timing, 1.0)

    return jsonify({
        'utility': utility,
        'M': M,
        'S': S,
        'curves': {
            'temperature': {'labels': T_labels, 'values': T_values},
            'time': {'labels': t_labels, 'values': t_values},
            'turns': {'labels': N_labels, 'values': N_values}
        }
    })


if __name__ == '__main__':
    app.run(debug=False, port=5000)
