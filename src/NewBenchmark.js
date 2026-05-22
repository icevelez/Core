import { component } from "../core/parser/handlebar.js";
import { signal, effect } from "../core/runtime.js";

export default component({
    template: `
        <div class="benchmark-page">

            <h1>Framework Benchmark</h1>

            <div class="controls">
                <button on:click="$.generate_rows">
                    Generate 10,000 Rows
                </button>

                <button on:click="$.shuffle_rows">
                    Shuffle Rows
                </button>

                <button on:click="$.clear_rows">
                    Clear Rows
                </button>

                <button on:click="$.toggle_if_block">
                    Toggle #if
                </button>

                <button on:click="$.run_await_test">
                    Run #await
                </button>

                <button on:click="$.replace_rows">
                    Replace Array
                </button>
            </div>

            <div class="stats">
                <p>Total Rows: {{ $.rows().length }}</p>
                <p>Selected Row: {{ $.selected_id() }}</p>
                <p>Render Count: {{ $.render_count() }}</p>
                <p>Input Value: {{ $.input_value() }}</p>
            </div>

            <hr/>

            <h2>Text Interpolation Benchmark</h2>

            <div class="text-grid">
                {{#each $.text_items() as item, i}}
                    <div class="text-item">
                        {{ $.i }} - {{ $.item }}
                    </div>
                {{/each}}
            </div>

            <hr/>

            <h2>Class Interpolation Benchmark</h2>

            <div class="class-grid">
                {{#each $.rows() as row}}
                    <div
                        :class="\`
                            row
                            \${ $.row.selected ? 'selected-row' : 'normal-row' }
                            \${ $.row.active ? 'active-row' : '' }
                        \`"
                    >
                        {{ $.row.name }}
                    </div>
                {{/each}}
            </div>

            <hr/>

            <h2>Two Way Binding Benchmark</h2>

            <h1>{{ $.input_value() }}</h1>
            <h1>{{ $.textarea_value() }}</h1>

            <div class="bindings">
                <input
                    type="text"
                    bind:value="$.input_value"
                    placeholder="Type here..."
                />

                <textarea
                    bind:value="$.textarea_value"
                ></textarea>

                <label>
                    <input
                        type="checkbox"
                        bind:checked="$.checkbox_value"
                    />
                    Enabled
                </label>

                <p>
                    Checkbox:
                    {{ $.checkbox_value() ? "Enabled" : "Disabled" }}
                </p>
            </div>

            <hr/>

            <h2>#if Benchmark</h2>

            {{#if $.show_if_block()}}
                <div class="if-container">

                    {{#each $.rows() as row}}
                        <div class="if-row">
                            {{ $.row.name }}
                        </div>
                    {{/each}}

                </div>
            {{:else}}
                <p>#if block hidden</p>
            {{/if}}

            <hr/>

            <h2>#await Benchmark</h2>

            {{#await $.async_rows()}}
                <p>Loading async rows...</p>

            {{:then rows}}
                <div class="await-grid">
                    {{#each $.rows as row}}
                        <div class="await-row">
                            {{ $.row.name }}
                        </div>
                    {{/each}}
                </div>

            {{:catch error}}
                <p>Error: {{ $.error.message }}</p>

            {{/await}}

            <hr/>

            <h2>#each Massive List Benchmark</h2>

            <div class="massive-list">

                {{#each $.rows() as row, i}}

                    <div
                        :class="\`
                            benchmark-row
                            \${ $.row.selected ? 'selected' : '' }
                        \`"
                    >

                        <div class="row-id">
                            {{ $.i }}
                        </div>

                        <input
                            type="text"
                            bind:value="$.row.name"
                        />

                        <input
                            type="number"
                            bind:value="$.row.value"
                        />

                        <button on:click="() => $.select_row($.row.id)">
                            Select
                        </button>

                        <button on:click="() => $.toggle_row($.i)">
                            Toggle
                        </button>

                        <span>
                            {{ $.row.description }}
                        </span>

                    </div>

                {{:empty}}

                    <p>No rows available.</p>

                {{/each}}

            </div>

        </div>`
}, class {

    rows = signal([]);

    text_items = signal([]);

    input_value = signal("hello world");

    textarea_value = signal("textarea benchmark");

    checkbox_value = signal(false);

    show_if_block = signal(true);

    selected_id = signal(null);

    render_count = signal(0);

    async_rows = signal(Promise.resolve([]));

    constructor() {

        const text = [];

        for (let i = 0; i < 10; i++) {
            text.push("Text Item " + i);
        }

        this.text_items.set(text);

        effect(() => {
            this.render_count.update(v => v + 1);

            this.rows();
            this.show_if_block();
            this.input_value();
            this.checkbox_value();
        });
    }

    generate_rows = () => {

        const rows = [];

        for (let i = 0; i < 10000; i++) {

            rows.push({
                id: i,
                name: "Row " + i + " " + Math.random().toString(16).substring(2,8),
                value: i,
                selected: false,
                active: i % 2 === 0,
                description:
                    "This is benchmark row number " + i
            });
        }

        console.time("generate_rows");

        this.rows.set(rows);

        console.timeEnd("generate_rows");
    }

    clear_rows = () => {

        console.time("clear_rows");

        this.rows.set([]);

        console.timeEnd("clear_rows");
    }

    replace_rows = () => {

        const rows = [];

        for (let i = 0; i < 10000; i++) {

            rows.push({
                id: i,
                name: "Replaced " + i,
                value: i * 10,
                selected: false,
                active: true,
                description:
                    "Replaced row " + i
            });
        }

        console.time("replace_rows");

        this.rows.set(rows);

        console.timeEnd("replace_rows");
    }

    shuffle_rows = () => {

        console.time("shuffle_rows");

        this.rows.update(rows => {

            for (let i = rows.length - 1; i > 0; i--) {

                const j =
                    Math.floor(Math.random() * (i + 1));

                const temp = rows[i];

                rows[i] = rows[j];
                rows[j] = temp;
            }

            return rows;
        });

        console.timeEnd("shuffle_rows");
    }

    toggle_if_block = () => {

        this.show_if_block.update(v => !v);
    }

    select_row = (id) => {

        this.selected_id.set(id);

        this.rows.update(rows => {

            for (const row of rows) {

                row.selected = row.id === id;
            }

            return rows;
        });
    }

    toggle_row = (index) => {

        this.rows.update(rows => {

            rows[index].active =
                !rows[index].active;

            return rows;
        });
    }

    run_await_test = () => {

        console.time("await_test");

        const promise = new Promise(resolve => {

            setTimeout(() => {

                const rows = [];

                for (let i = 0; i < 5000; i++) {

                    rows.push({
                        id: i,
                        name: "Async Row " + i
                    });
                }

                console.timeEnd("await_test");

                resolve(rows);

            }, 1000);
        });

        this.async_rows.set(promise);
    }
});
