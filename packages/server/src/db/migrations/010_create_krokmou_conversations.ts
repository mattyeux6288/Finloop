import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('krokmou_conversations', (table) => {
    table.string('id', 36).primary();
    table.string('fiscal_year_id', 36).notNullable()
      .references('id').inTable('fiscal_years').onDelete('CASCADE');
    table.string('user_id', 36).notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('title', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.index('fiscal_year_id');
    table.index('user_id');
  });

  await knex.schema.createTable('krokmou_messages', (table) => {
    table.string('id', 36).primary();
    table.string('conversation_id', 36).notNullable()
      .references('id').inTable('krokmou_conversations').onDelete('CASCADE');
    table.enu('role', ['user', 'assistant']).notNullable();
    table.text('content').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.index('conversation_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('krokmou_messages');
  await knex.schema.dropTableIfExists('krokmou_conversations');
}
